// The URL guard the Vectorscope applies before any socket is opened, and on every redirect hop.
// Pure: node:net only.

import { isIP } from "node:net";

// An empty or over-long URL is refused before anything else.
export const MAX_URL_LENGTH = 2048;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
  "instance-data",
]);

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".localdomain", ".onion"];

function ipv4IsPrivate(address) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true; // Unparseable is refused, not allowed.
  }
  const [a, b] = parts;
  if (a === 0) return true; // this network
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local, and the metadata endpoint
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a === 192 && b === 0) return true; // IETF protocol assignments
  if (a >= 224) return true; // multicast and reserved
  return false;
}

function ipv6IsPrivate(address) {
  const value = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (value === "::1" || value === "::") return true;
  // Unique-local and link-local.
  if (/^f[cd]/.test(value) || value.startsWith("fe80")) return true;
  // An IPv4 address wearing an IPv6 hat reaches the same places; `new URL` rewrites the dotted form to hex.
  const dotted = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) return ipv4IsPrivate(dotted[1]);

  const hex = value.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const high = parseInt(hex[1], 16);
    const low = parseInt(hex[2], 16);
    return ipv4IsPrivate(
      [(high >> 8) & 0xff, high & 0xff, (low >> 8) & 0xff, low & 0xff].join(".")
    );
  }
  return false;
}

/**
 * Whether a URL is one this tool may fetch. Returns { ok: true, url } or { ok: false, reason }.
 * Reasons: invalid_url | blocked_scheme | blocked_host | blocked_address.
 */
export function judgePublicUrl(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return { ok: false, reason: "invalid_url" };

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "blocked_scheme" };
  }

  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (!host) return { ok: false, reason: "invalid_url" };

  const version = isIP(host.replace(/^\[|\]$/g, ""));
  if (version === 4) {
    if (ipv4IsPrivate(host)) return { ok: false, reason: "blocked_address" };
  } else if (version === 6) {
    if (ipv6IsPrivate(host)) return { ok: false, reason: "blocked_address" };
  } else {
    // A name with no dot is a machine on this network, not a site on the web.
    if (!host.includes(".")) return { ok: false, reason: "blocked_host" };
    if (BLOCKED_HOSTNAMES.has(host)) return { ok: false, reason: "blocked_host" };
    if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
      return { ok: false, reason: "blocked_host" };
    }
  }

  // A port is how a public hostname reaches a private service behind it.
  if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
    return { ok: false, reason: "blocked_address" };
  }

  parsed.hash = "";
  return { ok: true, url: parsed.toString() };
}

/** The length check, then the address guard. */
export function judgeRequestedUrl(raw) {
  const url = String(raw || "").trim();
  if (!url) return { ok: false, reason: "invalid_url" };
  if (url.length > MAX_URL_LENGTH) return { ok: false, reason: "invalid_url" };
  return judgePublicUrl(url);
}
