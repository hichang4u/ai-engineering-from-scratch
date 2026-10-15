import assert from 'node:assert/strict';
import test from 'node:test';
import { transformText, injectDefaultLanguage, expandBraces, globToRegex } from '../build.mjs';
import * as vfs from '../src/vfs.js';

const settings = { origin: 'https://ko.example.dev', translationsRepository: 'me/fork', defaultLanguage: 'ko' };

test('translations and origin move to the fork, English sources stay upstream', () => {
  const input = [
    'https://raw.githubusercontent.com/rohitg00/ai-engineering-from-scratch/translations/i18n/ko/x.md',
    'https://raw.githubusercontent.com/rohitg00/ai-engineering-from-scratch/main/phases/x/docs/en.md',
    'https://aiengineeringfromscratch.com/lesson?path=x',
  ].join('\n');
  const [translated, english, page] = transformText(input, settings).split('\n');
  assert.equal(translated, 'https://raw.githubusercontent.com/me/fork/translations/i18n/ko/x.md');
  assert.equal(english, 'https://raw.githubusercontent.com/rohitg00/ai-engineering-from-scratch/main/phases/x/docs/en.md');
  assert.equal(page, 'https://ko.example.dev/lesson?path=x');
});

test('empty origin leaves the upstream origin alone', () => {
  assert.equal(transformText('https://aiengineeringfromscratch.com/', { ...settings, origin: '' }), 'https://aiengineeringfromscratch.com/');
});

test('default language script lands right after <head> and keeps <html lang="en">', () => {
  const html = injectDefaultLanguage('<html lang="en"><head><title>x</title></head></html>', 'ko');
  assert.match(html, /^<html lang="en"><head><script>try\{/);
  assert.match(html, /localStorage\.setItem\('lang',"ko"\)/);
  assert.equal(injectDefaultLanguage('<head></head>', 'en'), '<head></head>');
});

test('includeFiles globs expand like vercel.json', () => {
  assert.deepEqual(expandBraces('{a.json,lib/*.js}'), ['a.json', 'lib/*.js']);
  assert.ok(globToRegex('phases/*/*/docs/en.md').test('phases/01-x/02-y/docs/en.md'));
  assert.ok(!globToRegex('site/*.html').test('site/hubs/a.html'));
  assert.ok(globToRegex('site/**/*.js').test('site/a/b/c.js'));
});

test('vfs serves stored files and reports misses for published ones', () => {
  vfs.configure({ files: { 'site/a.html': '/a.html', 'lib/og-fonts/x.json': '/__repo/lib/og-fonts/x.json' } });
  vfs.put('site/a.html', new TextEncoder().encode('hello'));
  assert.equal(vfs.readFileSync('/repo/api/../site/a.html', 'utf8'), 'hello');
  assert.equal(vfs.readFileSync('/repo/site/a.html').toString('utf8'), 'hello');
  const before = vfs.missCount();
  assert.throws(() => vfs.readFileSync('/repo/lib/og-fonts/x.json', 'utf8'), { code: 'ENOENT' });
  assert.equal(vfs.missCount(), before + 1);
  assert.deepEqual(vfs.takeMisses(), ['lib/og-fonts/x.json']);
  assert.throws(() => vfs.readFileSync('/repo/nope.txt'), { code: 'ENOENT' });
  assert.equal(vfs.missCount(), before + 1);
  assert.deepEqual(vfs.readdirSync('/repo/lib/og-fonts'), ['x.json']);
  assert.ok(vfs.existsSync('/repo/lib'));
});
