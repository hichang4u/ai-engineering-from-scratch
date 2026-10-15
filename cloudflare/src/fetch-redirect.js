// Imported first by worker.js so modules that capture fetch at load time see it.
// Workers reject fetch(..., { redirect: 'error' }), which the translation and
// writing sources use. Emulate it: fetch manually and fail on any redirect.
const nativeFetch = globalThis.fetch;
globalThis.fetch = async function fetchWithRedirectError(input, init) {
  if (!init || init.redirect !== 'error') return nativeFetch(input, init);
  const response = await nativeFetch(input, { ...init, redirect: 'manual' });
  if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
    throw new TypeError(`fetch failed: unexpected redirect to ${response.headers.get('location')}`);
  }
  return response;
};
