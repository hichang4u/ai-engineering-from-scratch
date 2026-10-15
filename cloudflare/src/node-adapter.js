// Minimal Node/Vercel request and response objects for the api/ handlers.
// The handlers only use statusCode, setHeader/getHeader/removeHeader, end(),
// req.method/url/headers/query/socket and (for MCP) an async-iterable body.

const encoder = new TextEncoder();

function queryObject(params) {
  const out = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    out[key] = values.length > 1 ? values : values[0];
  }
  return out;
}

function createNodeRequest({ method, url, headers, query, clientIp, body }) {
  const plainHeaders = {};
  headers.forEach((value, key) => { plainHeaders[key] = value; });
  const socket = { remoteAddress: clientIp || undefined };
  return {
    method,
    url,
    headers: plainHeaders,
    query: queryObject(query),
    socket,
    connection: socket,
    async *[Symbol.asyncIterator]() {
      if (body && body.byteLength) yield body;
    },
  };
}

class NodeResponse {
  constructor() {
    this.statusCode = 200;
    this.statusMessage = '';
    this.headersSent = false;
    this.writableEnded = false;
    this.finished = false;
    this._headers = new Map();
    this._chunks = [];
    this.done = new Promise(resolve => { this._resolve = resolve; });
  }

  setHeader(name, value) {
    this._headers.set(String(name).toLowerCase(), { name: String(name), value });
    return this;
  }

  getHeader(name) {
    const entry = this._headers.get(String(name).toLowerCase());
    return entry ? entry.value : undefined;
  }

  getHeaders() {
    const out = {};
    for (const [key, entry] of this._headers) out[key] = entry.value;
    return out;
  }

  hasHeader(name) {
    return this._headers.has(String(name).toLowerCase());
  }

  removeHeader(name) {
    this._headers.delete(String(name).toLowerCase());
  }

  writeHead(status, message, headers) {
    this.statusCode = status;
    if (typeof message === 'object' && message) headers = message;
    else if (typeof message === 'string') this.statusMessage = message;
    for (const [name, value] of Object.entries(headers || {})) this.setHeader(name, value);
    this.headersSent = true;
    return this;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  write(chunk) {
    if (chunk !== undefined && chunk !== null) this._chunks.push(chunk);
    this.headersSent = true;
    return true;
  }

  end(chunk) {
    if (this.writableEnded) return this;
    if (typeof chunk === 'function') chunk = undefined;
    this.write(chunk);
    this.writableEnded = true;
    this.finished = true;
    this._resolve();
    return this;
  }

  body() {
    const parts = this._chunks.map(chunk => (typeof chunk === 'string' ? encoder.encode(chunk) : new Uint8Array(chunk.buffer || chunk, chunk.byteOffset || 0, chunk.byteLength)));
    const size = parts.reduce((sum, part) => sum + part.byteLength, 0);
    const out = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) { out.set(part, offset); offset += part.byteLength; }
    return out;
  }

  toResponse(method) {
    const headers = new Headers();
    for (const { name, value } of this._headers.values()) {
      if (name.toLowerCase() === 'content-length') continue;
      if (Array.isArray(value)) value.forEach(item => headers.append(name, String(item)));
      else headers.set(name, String(value));
    }
    const status = this.statusCode;
    const empty = method === 'HEAD' || status === 204 || status === 304 || (status >= 100 && status < 200);
    return new Response(empty ? null : this.body(), { status, headers });
  }
}

export { createNodeRequest, NodeResponse, queryObject };
