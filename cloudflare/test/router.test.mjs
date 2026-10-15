import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { compileConfig, compileSource, resolve, headersFor } from '../src/router.js';

const vercel = JSON.parse(fs.readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
const config = compileConfig(vercel);
const FUNCTIONS = new Set(['api/lesson', 'api/certification', 'api/og', 'api/markdown', 'api/v1/markdown', 'api/not-found', 'api/mcp', 'api/v1/catalog', 'api/v1/resource', 'api/blogs', 'api/writing']);
const ASSETS = new Set(['/index.html', '/about.html', '/catalog.html', '/agent-pages/about.md', '/agent-pages/index.md', '/hubs/phase/01-math-foundations.html', '/openapi.json', '/style.css', '/manuals.html']);

function route(target, { method = 'GET', accept = 'text/html' } = {}) {
  const url = new URL(target, 'https://example.test');
  const request = { method, pathname: url.pathname, searchParams: url.searchParams, headers: new Headers({ accept }), host: url.host };
  return resolve(config, request, { exists: p => ASSETS.has(p), functions: FUNCTIONS });
}

test('every vercel.json source pattern compiles', () => {
  for (const section of ['redirects', 'rewrites', 'headers']) {
    for (const rule of vercel[section]) assert.ok(compileSource(rule.source) instanceof RegExp, rule.source);
  }
});

test('path parameters, optional segments and escapes', () => {
  assert.match('/api', compileSource('/api/:missing*'));
  assert.match('/api/a/b', compileSource('/api/:missing*'));
  const page = compileSource('/:page(about|catalog).html');
  assert.equal('/about.html'.match(page).groups.page, 'about');
  assert.doesNotMatch('/aboutXhtml', page);
  assert.equal('/agent-pages/x.md'.match(compileSource('/agent-pages/:page.md')).groups.page, 'x');
});

test('home page is static html, markdown when asked', () => {
  assert.deepEqual(route('/'), { type: 'asset', pathname: '/index.html' });
  assert.deepEqual(route('/', { accept: 'text/markdown' }), { type: 'asset', pathname: '/agent-pages/index.md' });
});

test('clean urls rewrite to html and redirect from .html', () => {
  assert.deepEqual(route('/about'), { type: 'asset', pathname: '/about.html' });
  assert.deepEqual(route('/about', { accept: 'text/markdown' }), { type: 'asset', pathname: '/agent-pages/about.md' });
  assert.deepEqual(route('/about.html'), { type: 'redirect', status: 308, location: '/about' });
  assert.deepEqual(route('/phase/01-math-foundations'), { type: 'asset', pathname: '/hubs/phase/01-math-foundations.html' });
  assert.deepEqual(route('/manuals'), { type: 'asset', pathname: '/manuals.html' });
});

test('lesson and og routes reach functions with merged query', () => {
  const lesson = route('/lesson?path=phases/01-math-foundations/01-x&lang=ko');
  assert.equal(lesson.type, 'function');
  assert.equal(lesson.name, 'api/lesson');
  assert.equal(lesson.query.get('lang'), 'ko');
  const legacy = route('/lesson.html?path=p');
  assert.equal(legacy.query.get('legacy'), '1');
  assert.equal(legacy.query.get('path'), 'p');
  const card = route('/og/lesson/phases/01-a/02-b.png');
  assert.equal(card.name, 'api/og');
  assert.equal(card.query.get('type'), 'lesson');
  assert.equal(card.query.get('id'), 'phases/01-a/02-b');
});

test('redirects, trailing slash and missing-query conditions', () => {
  assert.deepEqual(route('/blogs/'), { type: 'response', status: 308, headers: { Location: '/blogs' } });
  assert.deepEqual(route('/about/'), { type: 'redirect', status: 308, location: '/about' });
  assert.deepEqual(route('/prereqs?x=1'), { type: 'redirect', status: 308, location: '/roadmap?x=1' });
  assert.deepEqual(route('/project'), { type: 'redirect', status: 307, location: '/projects' });
  assert.equal(route('/project?id=abc').type, 'not-found');
});

test('api paths: functions first, then the api catch-all', () => {
  assert.equal(route('/api/v1/catalog').name, 'api/v1/catalog');
  assert.deepEqual(route('/api/openapi.json'), { type: 'asset', pathname: '/openapi.json' });
  const missing = route('/api/nope');
  assert.equal(missing.name, 'api/not-found');
  assert.equal(missing.query.get('api'), '1');
  assert.equal(route('/mcp', { method: 'POST' }).name, 'api/mcp');
});

test('blog article routes', () => {
  const article = route('/blog/hello-world/');
  assert.equal(article.name, 'api/writing');
  assert.equal(article.query.get('path'), '/blog/hello-world/');
});

test('config headers match the request path', () => {
  const css = headersFor(config, { pathname: '/style.css', searchParams: new URLSearchParams(), headers: new Headers() });
  assert.equal(css.get('Cache-Control'), 'public, max-age=0, must-revalidate');
  const llms = headersFor(config, { pathname: '/llms.txt', searchParams: new URLSearchParams(), headers: new Headers() });
  assert.equal(llms.get('Content-Type'), 'text/markdown; charset=utf-8');
});
