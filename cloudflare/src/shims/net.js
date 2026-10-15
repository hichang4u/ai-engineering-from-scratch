// node:net stand-in: lib/agent-http.js only calls isIP.
const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

function isIPv4(value) {
  return IPV4.test(String(value));
}

function isIPv6(value) {
  const text = String(value);
  if (!text.includes(':') || /[^0-9a-fA-F:.]/.test(text)) return false;
  try {
    return new URL(`http://[${text}]/`).hostname.length > 2;
  } catch (_) {
    return false;
  }
}

function isIP(value) {
  if (isIPv4(value)) return 4;
  if (isIPv6(value)) return 6;
  return 0;
}

export { isIP, isIPv4, isIPv6 };
export default { isIP, isIPv4, isIPv6 };
