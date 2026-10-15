// Cloudflare Worker for the AI Engineering from Scratch site. Static files come
// from the assets binding; the Vercel api/ handlers run unchanged behind a Node
// request/response adapter and an in-memory fs (vfs.js). Routing is read from
// vercel.json by router.js. cloudflare/build.mjs produces the manifest.

import './fetch-redirect.js';
import vercel from '../../vercel.json';
import manifest from '../.build/manifest.json';
import { compileConfig, resolve, headersFor } from './router.js';
import { createNodeRequest, NodeResponse } from './node-adapter.js';
import * as vfs from './vfs.js';
import { representation } from '../../lib/agent-http.js';

import lesson from '../../api/lesson.js';
import certification from '../../api/certification.js';
import og from '../../api/og.js';
import markdown from '../../api/markdown.js';
import markdownV1 from '../../api/v1/markdown.js';
import notFound from '../../api/not-found.js';
import mcp from '../../api/mcp.js';
import catalog from '../../api/v1/catalog.js';
import resource from '../../api/v1/resource.js';
import blogs from '../../api/blogs.js';
import writing from '../../api/writing.js';

const HANDLERS = new Map([
  ['api/lesson', lesson],
  ['api/certification', certification],
  ['api/og', og],
  ['api/markdown', markdown],
  ['api/v1/markdown', markdownV1],
  ['api/not-found', notFound],
  ['api/mcp', mcp],
  ['api/v1/catalog', catalog],
  ['api/v1/resource', resource],
  ['api/blogs', blogs],
  ['api/writing', writing],
]);

// Functions whose GET responses are safe to keep in the colo cache, keyed by
// URL plus the negotiated representation.
const EDGE_CACHED = new Set(['api/lesson', 'api/certification', 'api/og', 'api/markdown', 'api/v1/markdown', 'api/blogs', 'api/writing']);
const MAX_ATTEMPTS = 4;
const HANDLER_TIMEOUT_MS = 25000;
const MAX_BODY_BYTES = 65537;
const ASSET_ORIGIN = 'https://assets.invalid';

const config = compileConfig(vercel);
const assets = new Set(manifest.assets);
vfs.configure(manifest);

function assetRequest(env, pathname, init) {
  return env.ASSETS.fetch(new Request(ASSET_ORIGIN + encodeURI(pathname), init));
}

async function loadFiles(env, repoPaths) {
  await Promise.all(repoPaths.filter(path => !vfs.has(path) && vfs.assetFor(path)).map(async path => {
    const response = await assetRequest(env, vfs.assetFor(path));
    if (response.ok) vfs.put(path, new Uint8Array(await response.arrayBuffer()));
  }));
}

async function readBody(request) {
  if (request.method === 'GET' || request.method === 'HEAD' || !request.body) return null;
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    chunks.push(value);
    if (size >= MAX_BODY_BYTES) { await reader.cancel(); break; }
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.byteLength; }
  return Buffer.from(out.buffer);
}

async function runHandler(env, request, url, name, query) {
  const handler = HANDLERS.get(name);
  const preload = (manifest.functions[name] && manifest.functions[name].preload) || [];
  const body = await readBody(request);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await loadFiles(env, preload);
    const before = vfs.missCount();
    const req = createNodeRequest({
      method: request.method,
      url: url.pathname + url.search,
      headers: request.headers,
      query,
      clientIp: request.headers.get('cf-connecting-ip'),
      body,
    });
    const res = new NodeResponse();
    let failure = null;
    try {
      await handler(req, res);
      let timer;
      await Promise.race([
        res.done,
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('handler-timeout')), HANDLER_TIMEOUT_MS); }),
      ]).finally(() => clearTimeout(timer));
    } catch (error) {
      failure = error;
    }
    if (vfs.missCount() !== before && attempt < MAX_ATTEMPTS) {
      await loadFiles(env, vfs.takeMisses());
      continue;
    }
    if (failure && !res.writableEnded) {
      console.error(`${name} failed`, failure);
      return new Response('Internal Server Error\n', { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
    return res.toResponse(request.method);
  }
  return new Response('Internal Server Error\n', { status: 500, headers: { 'Cache-Control': 'no-store' } });
}

function edgeCacheKey(url, request) {
  const key = new URL(url);
  key.searchParams.set('__cf_rep', representation(request.headers.get('accept')) || 'none');
  return new Request(key.toString(), { method: 'GET' });
}

function sharedMaxAge(cacheControl) {
  const match = /(?:^|,)\s*s-maxage=(\d+)/i.exec(cacheControl || '');
  return match ? Number(match[1]) : 0;
}

async function runFunction(env, ctx, request, url, name, query) {
  const cacheable = request.method === 'GET' && EDGE_CACHED.has(name) && typeof caches !== 'undefined';
  const key = cacheable ? edgeCacheKey(url, request) : null;
  if (cacheable) {
    const hit = await caches.default.match(key);
    if (hit) {
      const response = new Response(hit.body, hit);
      const original = response.headers.get('x-origin-cache-control');
      if (original) response.headers.set('Cache-Control', original);
      response.headers.delete('x-origin-cache-control');
      return response;
    }
  }
  const response = await runHandler(env, request, url, name, query);
  const maxAge = sharedMaxAge(response.headers.get('cache-control'));
  if (cacheable && response.status === 200 && maxAge > 0) {
    const stored = new Response(response.clone().body, response);
    stored.headers.set('x-origin-cache-control', response.headers.get('cache-control'));
    stored.headers.set('Cache-Control', `public, max-age=${maxAge}`);
    ctx.waitUntil(caches.default.put(key, stored));
  }
  return response;
}

async function serveAsset(env, request, pathname, status) {
  const upstream = await assetRequest(env, pathname, {
    method: request.method === 'HEAD' ? 'HEAD' : 'GET',
    headers: request.headers,
  });
  const response = new Response(upstream.body, upstream);
  if (status) return new Response(response.body, { status, headers: response.headers });
  return response;
}

function notFoundPage(env, request) {
  return serveAsset(env, request, '/404.html', 404).then(response => {
    response.headers.set('Cache-Control', 'no-store');
    return response;
  });
}

async function handle(request, env, ctx) {
  const url = new URL(request.url);
  const routed = {
    method: request.method.toUpperCase(),
    pathname: url.pathname,
    searchParams: url.searchParams,
    headers: request.headers,
    host: url.host,
  };
  if (url.pathname.startsWith('/__repo/')) return notFoundPage(env, request);

  const decision = resolve(config, routed, {
    exists: pathname => assets.has(pathname),
    functions: HANDLERS,
  });

  let response;
  let fromFunction = false;
  if (decision.type === 'response') {
    response = new Response(null, { status: decision.status, headers: decision.headers });
  } else if (decision.type === 'redirect') {
    response = new Response(null, { status: decision.status, headers: { Location: decision.location } });
  } else if (decision.type === 'function') {
    response = await runFunction(env, ctx, request, url, decision.name, decision.query);
    fromFunction = true;
  } else if (decision.type === 'asset') {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response = new Response('Method Not Allowed\n', { status: 405, headers: { Allow: 'GET, HEAD' } });
    } else {
      response = await serveAsset(env, request, decision.pathname);
    }
  } else {
    response = await notFoundPage(env, request);
  }

  response = new Response(response.body, response);
  for (const [name, value] of headersFor(config, routed)) {
    if (fromFunction && response.headers.has(name)) continue;
    response.headers.set(name, value);
  }
  return response;
}

export default {
  fetch(request, env, ctx) {
    return handle(request, env, ctx).catch(error => {
      console.error('worker failed', error);
      return new Response('Internal Server Error\n', { status: 500, headers: { 'Cache-Control': 'no-store' } });
    });
  },
};
