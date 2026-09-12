const MAX_URL_LENGTH = 2_048;
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_DNS_TIMEOUT_MS = 2_000;
const DEFAULT_MAX_REDIRECTS = 4;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const LOCAL_HOST_SUFFIXES = [
  '.internal',
  '.lan',
  '.local',
  '.localhost',
  '.home',
];

type DnsResolver = {
  resolveDns(query: string, recordType: 'A' | 'AAAA'): Promise<string[]>;
};

export interface PublicFetchOptions {
  timeoutMs?: number;
  dnsTimeoutMs?: number;
  maxRedirects?: number;
  allowedHostnames?: readonly string[];
}

export interface PublicFetchResult {
  response: Response;
  finalUrl: URL;
  cancelTimeout: () => void;
}

function parseIpv4(value: string): number[] | null {
  const parts = value.split('.');
  if (parts.length !== 4) return null;

  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) return Number.NaN;
    return Number(part);
  });

  return octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255)
    ? octets
    : null;
}

function parseIpv6(value: string): number[] | null {
  let address = value.toLowerCase().replace(/^\[|\]$/g, '');
  if (address.includes('%')) return null;

  if (address.includes('.')) {
    const lastColon = address.lastIndexOf(':');
    if (lastColon < 0) return null;

    const ipv4 = parseIpv4(address.slice(lastColon + 1));
    if (!ipv4) return null;

    const high = ((ipv4[0] << 8) | ipv4[1]).toString(16);
    const low = ((ipv4[2] << 8) | ipv4[3]).toString(16);
    address = `${address.slice(0, lastColon)}:${high}:${low}`;
  }

  const compressionParts = address.split('::');
  if (compressionParts.length > 2) return null;

  const left = compressionParts[0] ? compressionParts[0].split(':') : [];
  const right = compressionParts.length === 2 && compressionParts[1]
    ? compressionParts[1].split(':')
    : [];

  if (compressionParts.length === 1 && left.length !== 8) return null;
  if (compressionParts.length === 2 && left.length + right.length >= 8) return null;

  const zeroCount = compressionParts.length === 2 ? 8 - left.length - right.length : 0;
  const parts = [...left, ...Array(zeroCount).fill('0'), ...right];
  if (parts.length !== 8 || parts.some((part) => !/^[0-9a-f]{1,4}$/.test(part))) {
    return null;
  }

  return parts.map((part) => Number.parseInt(part, 16));
}

function isPublicIpv4(address: string): boolean {
  const octets = parseIpv4(address);
  if (!octets) return false;

  const [a, b, c] = octets;

  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 0 && c === 0) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 192 && b === 88 && c === 99) return false;
  if (a === 192 && b === 168) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;

  return true;
}

function isPublicIpv6(address: string): boolean {
  const parts = parseIpv6(address);
  if (!parts) return false;

  // At present, publicly routable IPv6 unicast addresses live in 2000::/3.
  if ((parts[0] & 0xe000) !== 0x2000) return false;

  // Documentation, benchmarking, transition and ORCHID ranges are never fetch targets.
  if (parts[0] === 0x2001 && parts[1] === 0x0000) return false;
  if (parts[0] === 0x2001 && parts[1] === 0x0002) return false;
  if (parts[0] === 0x2001 && (parts[1] & 0xfff0) === 0x0010) return false;
  if (parts[0] === 0x2001 && (parts[1] & 0xfff0) === 0x0020) return false;
  if (parts[0] === 0x2001 && parts[1] === 0x0db8) return false;
  if (parts[0] === 0x2002) return false;
  if (parts[0] === 0x3fff && (parts[1] & 0xf000) === 0x0000) return false;

  return true;
}

export function isPublicIpAddress(address: string): boolean {
  const normalized = address.replace(/^\[|\]$/g, '');
  return normalized.includes(':') ? isPublicIpv6(normalized) : isPublicIpv4(normalized);
}

function isAllowedHostname(hostname: string, allowedHostnames: readonly string[]): boolean {
  if (allowedHostnames.length === 0) return true;

  return allowedHostnames.some((entry) => {
    const normalizedEntry = entry.trim().toLowerCase().replace(/\.+$/g, '');
    const isWildcard = normalizedEntry.startsWith('*.');
    const allowed = normalizedEntry.replace(/^\*\./, '');
    if (!allowed) return false;
    return isWildcard ? hostname.endsWith(`.${allowed}`) : hostname === allowed;
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

async function resolvePublicAddresses(hostname: string, timeoutMs: number): Promise<void> {
  const denoRuntime = (globalThis as typeof globalThis & { Deno?: DnsResolver }).Deno;
  if (!denoRuntime?.resolveDns) {
    throw new Error('DNS validation is unavailable');
  }

  const results = await Promise.allSettled([
    withTimeout(denoRuntime.resolveDns(hostname, 'A'), timeoutMs, 'IPv4 DNS lookup'),
    withTimeout(denoRuntime.resolveDns(hostname, 'AAAA'), timeoutMs, 'IPv6 DNS lookup'),
  ]);

  const addresses = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  if (addresses.length === 0) {
    throw new Error('Hostname did not resolve to a public address');
  }

  if (addresses.some((address) => !isPublicIpAddress(address))) {
    throw new Error('Hostname resolves to a non-public address');
  }
}

export async function assertPublicHttpUrl(
  input: string | URL,
  options: Pick<PublicFetchOptions, 'dnsTimeoutMs' | 'allowedHostnames'> = {},
): Promise<URL> {
  const rawUrl = input instanceof URL ? input.href : input;
  if (rawUrl.length > MAX_URL_LENGTH) throw new Error('URL is too long');

  let url: URL;
  try {
    url = input instanceof URL ? new URL(input.href) : new URL(input);
  } catch {
    throw new Error('Invalid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are allowed');
  }
  if (url.username || url.password) throw new Error('URL credentials are not allowed');

  const expectedPort = url.protocol === 'https:' ? '443' : '80';
  if (url.port && url.port !== expectedPort) {
    throw new Error('Non-standard URL ports are not allowed');
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!hostname || hostname === 'localhost' || LOCAL_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    throw new Error('Local hostnames are not allowed');
  }

  const allowedHostnames = options.allowedHostnames ?? [];
  if (!isAllowedHostname(hostname, allowedHostnames)) {
    throw new Error('Hostname is not in the configured allowlist');
  }

  const directIpv4 = parseIpv4(hostname);
  const directIpv6 = hostname.includes(':') ? parseIpv6(hostname) : null;
  if (directIpv4 || directIpv6) {
    if (!isPublicIpAddress(hostname)) throw new Error('Non-public IP addresses are not allowed');
    return url;
  }

  await resolvePublicAddresses(hostname, options.dnsTimeoutMs ?? DEFAULT_DNS_TIMEOUT_MS);
  return url;
}

async function cancelResponseBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // The body may already be closed; there is nothing else to release.
  }
}

export async function fetchPublicUrl(
  input: string | URL,
  init: RequestInit = {},
  options: PublicFetchOptions = {},
): Promise<PublicFetchResult> {
  const method = (init.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    throw new Error('Safe public fetch only supports GET and HEAD');
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const cancelTimeout = () => clearTimeout(timeoutId);

  if (init.signal) {
    if (init.signal.aborted) controller.abort();
    else init.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let currentUrl: URL;
  try {
    currentUrl = await assertPublicHttpUrl(input, options);
    let headers = new Headers(init.headers);

    for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
      const response = await fetch(currentUrl, {
        ...init,
        headers,
        method,
        redirect: 'manual',
        signal: controller.signal,
      });

      if (!REDIRECT_STATUSES.has(response.status)) {
        return { response, finalUrl: currentUrl, cancelTimeout };
      }

      const location = response.headers.get('location');
      if (!location) {
        return { response, finalUrl: currentUrl, cancelTimeout };
      }
      if (redirectCount === maxRedirects) {
        await cancelResponseBody(response);
        throw new Error('Too many redirects');
      }

      let nextUrl: URL;
      try {
        nextUrl = new URL(location, currentUrl);
      } catch {
        await cancelResponseBody(response);
        throw new Error('Redirect contains an invalid URL');
      }

      await cancelResponseBody(response);
      nextUrl = await assertPublicHttpUrl(nextUrl, options);

      if (nextUrl.origin !== currentUrl.origin) {
        headers = new Headers(headers);
        headers.delete('authorization');
        headers.delete('cookie');
        headers.delete('proxy-authorization');
        headers.delete('x-api-key');
      }

      currentUrl = nextUrl;
    }

    throw new Error('Too many redirects');
  } catch (error) {
    cancelTimeout();
    throw error;
  }
}

export async function readResponseBytes(response: Response, maxBytes: number): Promise<Uint8Array> {
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const declaredBytes = Number(contentLength);
    if (!Number.isSafeInteger(declaredBytes) || declaredBytes < 0 || declaredBytes > maxBytes) {
      await cancelResponseBody(response);
      throw new Error('Remote response exceeds the size limit');
    }
  }

  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel('Remote response exceeds the size limit');
        throw new Error('Remote response exceeds the size limit');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const output = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}
