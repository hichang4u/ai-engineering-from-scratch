#!/usr/bin/env node
// Builds the Cloudflare Worker deploy for this fork.
//
//   node cloudflare/build.mjs              # site build + assets + worker bundle
//   node cloudflare/build.mjs --skip-site  # reuse an existing site/ build
//
// 1. Runs the same buildCommand Vercel runs (from vercel.json).
// 2. Copies site/ to cloudflare/.dist/assets and publishes the repository files
//    the api/ handlers read (vercel.json functions.*.includeFiles) under
//    /__repo, which the Worker never serves publicly.
// 3. Applies the fork settings from cloudflare/site.config.json: origin,
//    translations repository, default language.
// 4. Bundles cloudflare/src/worker.js with esbuild into cloudflare/.dist/worker/worker.js.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DIST = path.join(HERE, '.dist');
const ASSETS = path.join(DIST, 'assets');
const BUILD = path.join(HERE, '.build');
const UPSTREAM_ORIGIN = 'https://aiengineeringfromscratch.com';
const UPSTREAM_REPOSITORY = 'rohitg00/ai-engineering-from-scratch';
const TEXT = /\.(?:html|js|mjs|json|xml|txt|md|css|svg|webmanifest)$/i;
// A glob matching more files than this is read on demand instead of preloaded.
const PRELOAD_LIMIT = 20;
const NODE_BUILTINS = ['path', 'zlib', 'crypto', 'buffer'];

function loadSettings() {
  const file = JSON.parse(fs.readFileSync(path.join(HERE, 'site.config.json'), 'utf8'));
  const settings = {
    origin: process.env.AIFS_ORIGIN ?? file.origin ?? '',
    translationsRepository: process.env.AIFS_TRANSLATIONS_REPOSITORY ?? file.translationsRepository ?? UPSTREAM_REPOSITORY,
    defaultLanguage: process.env.AIFS_DEFAULT_LANG ?? file.defaultLanguage ?? '',
  };
  settings.origin = settings.origin.replace(/\/+$/, '');
  if (settings.origin && !/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(settings.origin)) throw new Error(`origin must be https://host, got ${settings.origin}`);
  if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(settings.translationsRepository)) throw new Error(`bad translationsRepository ${settings.translationsRepository}`);
  if (settings.defaultLanguage && !/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(settings.defaultLanguage)) throw new Error(`bad defaultLanguage ${settings.defaultLanguage}`);
  return settings;
}

// Rewrites upstream-specific strings in deployed text. English lesson sources
// and GitHub links keep pointing upstream; only translations and the public
// origin move to the fork.
function transformText(text, settings) {
  let out = text;
  if (settings.translationsRepository !== UPSTREAM_REPOSITORY) {
    out = out
      .replaceAll(`raw.githubusercontent.com/${UPSTREAM_REPOSITORY}/translations/`, `raw.githubusercontent.com/${settings.translationsRepository}/translations/`)
      .replaceAll(`github.com/${UPSTREAM_REPOSITORY}/blob/translations/`, `github.com/${settings.translationsRepository}/blob/translations/`);
  }
  if (settings.origin && settings.origin !== UPSTREAM_ORIGIN) out = out.replaceAll(UPSTREAM_ORIGIN, settings.origin);
  return out;
}

// First visit only: store the fork's default language, so choosing English in
// the picker (which removes the "lang" key) is remembered afterwards.
function defaultLanguageScript(lang) {
  const code = JSON.stringify(lang);
  return `<script>try{if(!localStorage.getItem('aifs-default-lang')){localStorage.setItem('aifs-default-lang',${code});if(!localStorage.getItem('lang'))localStorage.setItem('lang',${code})}}catch(e){}</script>`;
}

function injectDefaultLanguage(html, lang) {
  if (!lang || lang === 'en') return html;
  const match = /<head(?:\s[^>]*)?>/i.exec(html);
  if (!match) return html;
  const at = match.index + match[0].length;
  return html.slice(0, at) + defaultLanguageScript(lang) + html.slice(at);
}

function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else if (entry.isFile()) out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

function expandBraces(pattern) {
  const match = /^(.*?)\{([^{}]*)\}(.*)$/.exec(pattern);
  if (!match) return [pattern];
  return match[2].split(',').flatMap(part => expandBraces(match[1] + part + match[3]));
}

function globToRegex(glob) {
  let out = '';
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === '*' && glob[i + 1] === '*') { out += '.*'; i++; if (glob[i + 1] === '/') i++; }
    else if (ch === '*') out += '[^/]*';
    else if (ch === '?') out += '[^/]';
    else out += /[\\^$.+()[\]{}|]/.test(ch) ? '\\' + ch : ch;
  }
  return new RegExp(`^${out}$`);
}

function matchGlobs(globs, files) {
  return globs.map(glob => ({ glob, matches: files.filter(file => globToRegex(glob).test(file)) }));
}

function repositoryFiles() {
  const tracked = execSync('git ls-files -z', { cwd: ROOT, maxBuffer: 1 << 28 }).toString('utf8').split('\0').filter(Boolean);
  const generated = fs.existsSync(path.join(ROOT, 'generated')) ? walk(path.join(ROOT, 'generated')).map(file => `generated/${file}`) : [];
  return [...new Set(tracked.concat(generated))].filter(file => fs.existsSync(path.join(ROOT, file)));
}

function runSiteBuild(vercel, settings) {
  console.log('> site build:', vercel.buildCommand);
  execSync(vercel.buildCommand, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, AIFS_TRANSLATIONS_REPOSITORY: settings.translationsRepository },
  });
}

function copyFile(from, to, settings, injectLang) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (!TEXT.test(from)) { fs.copyFileSync(from, to); return; }
  let text = transformText(fs.readFileSync(from, 'utf8'), settings);
  if (injectLang && from.endsWith('.html')) text = injectDefaultLanguage(text, settings.defaultLanguage);
  fs.writeFileSync(to, text);
}

function assemble(vercel, settings) {
  try {
    fs.rmSync(DIST, { recursive: true, force: true });
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EBUSY') throw new Error(`${DIST} is locked; stop \`wrangler dev\` and build again`);
    throw error;
  }
  fs.mkdirSync(ASSETS, { recursive: true });

  const siteFiles = walk(path.join(ROOT, 'site'));
  for (const file of siteFiles) copyFile(path.join(ROOT, 'site', file), path.join(ASSETS, file), settings, true);

  const files = {};
  for (const file of siteFiles) files[`site/${file}`] = `/${file}`;

  const repoFiles = repositoryFiles();
  const functions = {};
  for (const [source, options] of Object.entries(vercel.functions || {})) {
    const name = source.replace(/\.js$/, '');
    const include = options.includeFiles ? expandBraces(options.includeFiles) : [];
    const exclude = options.excludeFiles ? expandBraces(options.excludeFiles).map(globToRegex) : [];
    const preload = new Set();
    for (const { matches } of matchGlobs(include, repoFiles)) {
      const kept = matches.filter(file => !exclude.some(re => re.test(file)));
      for (const file of kept) {
        if (!files[file]) {
          files[file] = `/__repo/${file}`;
          copyFile(path.join(ROOT, file), path.join(ASSETS, '__repo', file), settings, false);
        }
      }
      if (kept.length <= PRELOAD_LIMIT) kept.forEach(file => preload.add(file));
    }
    functions[name] = { preload: [...preload].sort() };
  }
  // api/writing.js reuses the blogs handler and template.
  if (functions['api/blogs'] && !functions['api/writing']) functions['api/writing'] = functions['api/blogs'];

  const publicAssets = siteFiles.map(file => `/${file}`).sort();
  fs.mkdirSync(BUILD, { recursive: true });
  fs.writeFileSync(path.join(BUILD, 'manifest.json'), JSON.stringify({ assets: publicAssets, files, functions }) + '\n');
  const repoCount = Object.values(files).filter(asset => asset.startsWith('/__repo/')).length;
  console.log(`> assets: ${siteFiles.length} public files, ${repoCount} handler files under /__repo`);
}

const BUNDLE_BANNER = [
  ...NODE_BUILTINS.map(name => `import * as __node_${name} from 'node:${name}';`),
  `const __node_modules = { ${NODE_BUILTINS.map(name => `'${name}': __node_${name}, 'node:${name}': __node_${name}`).join(', ')} };`,
  `const require = (id) => { if (Object.hasOwn(__node_modules, id)) return __node_modules[id]; throw new Error('module not bundled: ' + id); };`,
].join('\n');

async function bundle(settings) {
  const esbuild = await import('esbuild');
  const shims = {
    fs: path.join(HERE, 'src', 'vfs.js'),
    http: path.join(HERE, 'src', 'shims', 'http.js'),
    net: path.join(HERE, 'src', 'shims', 'net.js'),
  };
  const plugin = {
    name: 'aifs-worker',
    setup(build) {
      build.onResolve({ filter: /^(?:node:)?[a-z_]+$/ }, args => {
        const id = args.path.replace(/^node:/, '');
        if (shims[id]) return { path: shims[id] };
        if (NODE_BUILTINS.includes(id)) return { path: `node:${id}`, external: true };
        if (args.path.startsWith('node:') || ['fs', 'os', 'child_process', 'url', 'util', 'stream', 'events'].includes(id)) {
          return { errors: [{ text: `node builtin "${args.path}" is not available in the Worker bundle (imported by ${args.importer})` }] };
        }
        return undefined;
      });
      build.onLoad({ filter: /\.js$/ }, args => {
        const relative = path.relative(ROOT, args.path).split(path.sep).join('/');
        if (relative.startsWith('..') || relative.startsWith('cloudflare/')) return undefined;
        const dir = path.posix.dirname(relative);
        const source = transformText(fs.readFileSync(args.path, 'utf8'), settings);
        const header = `var __dirname = ${JSON.stringify('/repo/' + dir)}, __filename = ${JSON.stringify('/repo/' + relative)};\n`;
        return { contents: header + source, loader: 'js' };
      });
    },
  };
  await esbuild.build({
    entryPoints: [path.join(HERE, 'src', 'worker.js')],
    outfile: path.join(DIST, 'worker', 'worker.js'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'es2022',
    banner: { js: BUNDLE_BANNER },
    define: { 'process.env.AIFS_TRANSLATIONS_REPOSITORY': JSON.stringify(settings.translationsRepository) },
    plugins: [plugin],
    logLevel: 'warning',
    legalComments: 'none',
  });
  const size = fs.statSync(path.join(DIST, 'worker', 'worker.js')).size;
  console.log(`> worker bundle: ${(size / 1024).toFixed(0)} KiB`);
}

// Every api/ handler must be registered in src/worker.js, or its route would
// silently fall through to a 404 after an upstream merge.
function checkHandlers() {
  const worker = fs.readFileSync(path.join(HERE, 'src', 'worker.js'), 'utf8');
  const registered = new Set([...worker.matchAll(/\['(api\/[a-z0-9/-]+)',/g)].map(match => match[1]));
  const handlers = walk(path.join(ROOT, 'api')).filter(file => file.endsWith('.js')).map(file => `api/${file.replace(/\.js$/, '')}`);
  const missing = handlers.filter(name => !registered.has(name));
  if (missing.length) throw new Error(`register these handlers in cloudflare/src/worker.js HANDLERS: ${missing.join(', ')}`);
}

async function main() {
  checkHandlers();
  const settings = loadSettings();
  console.log('> settings', settings);
  const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  if (!process.argv.includes('--skip-site')) runSiteBuild(vercel, settings);
  assemble(vercel, settings);
  await bundle(settings);
}

export { transformText, injectDefaultLanguage, expandBraces, globToRegex };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
