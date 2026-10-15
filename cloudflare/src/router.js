// Interprets the routing half of vercel.json (routes, redirects, rewrites,
// headers, trailingSlash) so the Cloudflare Worker serves the same URLs as the
// Vercel deploy. vercel.json stays the single source of truth: an upstream
// route change reaches this fork on the next build without a second table.
//
// Order follows the Vercel routing phases this repo relies on: legacy routes,
// trailing-slash and redirects, the filesystem (assets and functions), then
// rewrites, then 404.

const PARAM_NAME = /^[A-Za-z_][A-Za-z0-9_]*/;

function escapeRegex(ch) {
  return /[\\^$.*+?()[\]{}|]/.test(ch) ? '\\' + ch : ch;
}

// Reads a balanced "(...)" group starting at text[start] === '('.
function readGroup(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\') { i++; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return { body: text.slice(start + 1, i), end: i + 1 };
    }
  }
  throw new Error(`unbalanced group in ${text}`);
}

// Compiles the path-to-regexp subset vercel.json uses: literals, "\." escapes,
// ":name", ":name(re)", ":name*", ":name?" and unnamed "(re)" groups.
// Returns a RegExp whose named groups hold ":name" values; unnamed groups are
// numbered in source order for "$1"-style destinations.
function compileSource(source) {
  let out = '';
  let unnamed = 0;
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') {
      out += escapeRegex(source[i + 1] || '');
      i += 2;
      continue;
    }
    if (ch === ':' && PARAM_NAME.test(source.slice(i + 1))) {
      const name = source.slice(i + 1).match(PARAM_NAME)[0];
      i += 1 + name.length;
      let pattern = '[^/]+';
      if (source[i] === '(') {
        const group = readGroup(source, i);
        pattern = group.body;
        i = group.end;
      }
      const modifier = source[i] === '*' || source[i] === '+' || source[i] === '?' ? source[i++] : '';
      if (modifier === '*' || modifier === '+') pattern = `${pattern}(?:/${pattern})*`;
      const capture = `(?<${name}>${pattern})`;
      if ((modifier === '*' || modifier === '?') && out.endsWith('/')) {
        out = out.slice(0, -1) + `(?:/${capture})?`;
      } else {
        out += modifier === '*' || modifier === '?' ? `${capture}?` : capture;
      }
      continue;
    }
    if (ch === '(') {
      const group = readGroup(source, i);
      unnamed++;
      out += `(?<_${unnamed}>${group.body})`;
      i = group.end;
      continue;
    }
    out += escapeRegex(ch);
    i++;
  }
  return new RegExp(`^${out}$`);
}

// vercel.json "has" values are PCRE strings; "(?i)" is the only inline flag used.
function compileValue(value) {
  if (value === undefined) return null;
  let flags = '';
  let body = String(value);
  if (body.startsWith('(?i)')) { flags = 'i'; body = body.slice(4); }
  return new RegExp(`^(?:${body})$`, flags);
}

function compileConditions(list) {
  return (list || []).map(item => ({ type: item.type, key: String(item.key || '').toLowerCase(), queryKey: item.key, value: compileValue(item.value) }));
}

function conditionHolds(condition, request) {
  let actual;
  if (condition.type === 'header') actual = request.headers.get(condition.key);
  else if (condition.type === 'query') actual = request.searchParams.get(condition.queryKey);
  else if (condition.type === 'host') actual = request.host;
  else return false;
  if (actual === null || actual === undefined) return false;
  return condition.value ? condition.value.test(actual) : true;
}

function conditionsPass(rule, request) {
  return rule.has.every(c => conditionHolds(c, request)) && !rule.missing.some(c => conditionHolds(c, request));
}

function compileConfig(vercel) {
  return {
    trailingSlash: vercel.trailingSlash,
    routes: (vercel.routes || []).map(route => ({
      re: new RegExp(`^${route.src}$`),
      methods: route.methods ? route.methods.map(m => m.toUpperCase()) : null,
      has: compileConditions(route.has),
      missing: compileConditions(route.missing),
      status: route.status || null,
      headers: route.headers || {},
      dest: route.dest || null,
    })),
    redirects: (vercel.redirects || []).map(rule => ({
      re: compileSource(rule.source),
      has: compileConditions(rule.has),
      missing: compileConditions(rule.missing),
      destination: rule.destination,
      status: rule.statusCode || (rule.permanent === false ? 307 : 308),
    })),
    rewrites: (vercel.rewrites || []).map(rule => ({
      re: compileSource(rule.source),
      has: compileConditions(rule.has),
      missing: compileConditions(rule.missing),
      destination: rule.destination,
    })),
    headers: (vercel.headers || []).map(rule => ({
      re: compileSource(rule.source),
      has: compileConditions(rule.has),
      missing: compileConditions(rule.missing),
      headers: rule.headers || [],
    })),
  };
}

// Fills "$1" (numbered, from unnamed or regex groups) and ":name" (named).
function substitute(template, match) {
  const groups = match.groups || {};
  return template
    .replace(/\$(\d+)/g, (_, n) => {
      const named = groups[`_${n}`];
      if (named !== undefined) return named;
      return match[Number(n)] || '';
    })
    .replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (whole, name) => (name in groups ? groups[name] || '' : whole));
}

function splitTarget(target) {
  const index = target.indexOf('?');
  return index < 0 ? { pathname: target, query: '' } : { pathname: target.slice(0, index), query: target.slice(index + 1) };
}

// Destination query parameters override same-named request parameters.
function mergeQuery(original, destinationQuery) {
  const merged = new URLSearchParams(original);
  for (const [key, value] of new URLSearchParams(destinationQuery)) merged.set(key, value);
  return merged;
}

function functionNameFor(pathname, functions) {
  const name = pathname.replace(/^\//, '').replace(/\.js$/, '');
  return functions.has(name) ? name : null;
}

// Resolves a request to one of:
//   { type: 'response', status, headers }        (route with a status, no dest)
//   { type: 'redirect', status, location }
//   { type: 'function', name, query }            (query = merged URLSearchParams)
//   { type: 'asset', pathname }
//   { type: 'not-found' }
// `exists(pathname)` answers whether a public asset is published at pathname.
function resolve(config, request, { exists, functions }) {
  const { method, pathname } = request;
  const originalQuery = request.searchParams.toString();

  const target = (destination, query) => {
    const fn = functionNameFor(destination, functions);
    if (fn) return { type: 'function', name: fn, query };
    if (exists(destination)) return { type: 'asset', pathname: destination };
    return null;
  };

  for (const route of config.routes) {
    if (route.methods && !route.methods.includes(method)) continue;
    const match = pathname.match(route.re);
    if (!match || !conditionsPass(route, request)) continue;
    if (route.status && !route.dest) return { type: 'response', status: route.status, headers: route.headers };
    if (route.dest) {
      const { pathname: destPath, query } = splitTarget(substitute(route.dest, match));
      const found = target(destPath, mergeQuery(originalQuery, query));
      if (found) return found;
      return { type: 'not-found' };
    }
  }

  if (config.trailingSlash === false && pathname.length > 1 && pathname.endsWith('/')) {
    const trimmed = pathname.replace(/\/+$/, '') || '/';
    return { type: 'redirect', status: 308, location: trimmed + (originalQuery ? `?${originalQuery}` : '') };
  }

  for (const rule of config.redirects) {
    const match = pathname.match(rule.re);
    if (!match || !conditionsPass(rule, request)) continue;
    const { pathname: destPath, query } = splitTarget(substitute(rule.destination, match));
    const merged = mergeQuery(originalQuery, query).toString();
    return { type: 'redirect', status: rule.status, location: destPath + (merged ? `?${merged}` : '') };
  }

  const direct = target(pathname === '/' ? '/index.html' : pathname, new URLSearchParams(originalQuery));
  if (direct) return direct;

  for (const rule of config.rewrites) {
    const match = pathname.match(rule.re);
    if (!match || !conditionsPass(rule, request)) continue;
    const { pathname: destPath, query } = splitTarget(substitute(rule.destination, match));
    const found = target(destPath, mergeQuery(originalQuery, query));
    if (found) return found;
    return { type: 'not-found' };
  }

  return { type: 'not-found' };
}

// Collects config headers for the request path; later rules win, as on Vercel.
function headersFor(config, request) {
  const out = new Map();
  for (const rule of config.headers) {
    if (!rule.re.test(request.pathname) || !conditionsPass(rule, request)) continue;
    for (const { key, value } of rule.headers) out.set(key, value);
  }
  return out;
}

export { compileConfig, compileSource, resolve, headersFor, substitute };
