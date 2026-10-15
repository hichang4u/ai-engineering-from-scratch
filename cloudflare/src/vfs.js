// Synchronous node:fs subset for the bundled api/ handlers. The handlers read
// repository files with readFileSync, which a Worker cannot do, so the build
// publishes those files as static assets and this module serves them from an
// in-memory store the Worker fills (env.ASSETS) before a handler runs.
//
// Paths are POSIX and rooted at /repo (the bundler gives every module a
// __dirname under /repo). A published file the store does not hold yet is
// recorded as a miss so the Worker can fetch it and run the handler again.

const ROOT = '/repo/';
const store = new Map();
const decoder = new TextDecoder();
let manifest = { files: {} };
const misses = new Set();
let missTotal = 0;

function configure(nextManifest) {
  manifest = nextManifest;
}

function normalize(input) {
  let value = String(input instanceof URL ? input.pathname : input).replace(/\\/g, '/');
  if (!value.startsWith('/')) value = ROOT + value;
  const parts = [];
  for (const part of value.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  const absolute = '/' + parts.join('/');
  return absolute.startsWith(ROOT) ? absolute.slice(ROOT.length) : absolute.slice(1);
}

function enoent(syscall, file) {
  const error = new Error(`ENOENT: no such file or directory, ${syscall} '${file}'`);
  error.code = 'ENOENT';
  error.errno = -2;
  error.syscall = syscall;
  error.path = file;
  return error;
}

function encodingOf(options) {
  if (typeof options === 'string') return options;
  return options && options.encoding ? options.encoding : null;
}

function readFileSync(file, options) {
  const repoPath = normalize(file);
  if (!Object.hasOwn(manifest.files, repoPath)) throw enoent('open', repoPath);
  const bytes = store.get(repoPath);
  if (!bytes) {
    misses.add(repoPath);
    missTotal++;
    throw enoent('open', repoPath);
  }
  const encoding = encodingOf(options);
  if (encoding) return decoder.decode(bytes);
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function existsSync(file) {
  const repoPath = normalize(file);
  if (Object.hasOwn(manifest.files, repoPath)) return true;
  const prefix = repoPath ? repoPath + '/' : '';
  return Object.keys(manifest.files).some(name => name.startsWith(prefix));
}

function readdirSync(dir) {
  const repoPath = normalize(dir);
  const prefix = repoPath ? repoPath + '/' : '';
  const names = new Set();
  for (const name of Object.keys(manifest.files)) {
    if (name.startsWith(prefix)) names.add(name.slice(prefix.length).split('/')[0]);
  }
  if (!names.size) throw enoent('scandir', repoPath);
  return [...names].sort();
}

function statSync(file) {
  const repoPath = normalize(file);
  const isFile = Object.hasOwn(manifest.files, repoPath);
  if (!isFile && !existsSync(file)) throw enoent('stat', repoPath);
  return { isFile: () => isFile, isDirectory: () => !isFile };
}

// Worker-side API.
function assetFor(repoPath) {
  return manifest.files[repoPath];
}

function has(repoPath) {
  return store.has(repoPath);
}

function put(repoPath, bytes) {
  store.set(repoPath, bytes);
}

// Requests share one isolate and may interleave at await points, so misses are
// pooled: a run that saw the counter move fetches the pool and retries.
function missCount() {
  return missTotal;
}

function takeMisses() {
  const found = [...misses];
  misses.clear();
  return found;
}

const promises = {
  readFile: async (file, options) => readFileSync(file, options),
};

export { configure, normalize, readFileSync, existsSync, readdirSync, statSync, promises, assetFor, has, put, missCount, takeMisses };
export default { readFileSync, existsSync, readdirSync, statSync, promises };
