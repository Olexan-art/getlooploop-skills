// Optional: the same page through a local headless Chrome or Chromium (--dump-dom), so the report
// can say how much of the page only exists once JavaScript runs. The reading itself stays the
// no-JavaScript one; this only adds a comparison.

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";

export const RENDER_TIMEOUT_MS = 45_000;
// How long the page's own scripts get inside the browser's virtual clock.
export const RENDER_BUDGET_MS = 10_000;

const COMMON_PATHS = [
  // Windows
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Google/Chrome Dev/Application/chrome.exe",
  "C:/Program Files/Google/Chrome Beta/Application/chrome.exe",
  "C:/Program Files/Chromium/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
];
const PATH_NAMES = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome", "microsoft-edge"];

/** The browser to use: CHROME_PATH, then the usual install paths, then PATH. Null when none. */
export function findBrowser(env = process.env) {
  if (env.CHROME_PATH && existsSync(env.CHROME_PATH)) return env.CHROME_PATH;
  const local = env.LOCALAPPDATA ? [join(env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"), join(env.LOCALAPPDATA, "Chromium/Application/chrome.exe")] : [];
  for (const candidate of [...COMMON_PATHS, ...local]) if (existsSync(candidate)) return candidate;
  for (const dir of String(env.PATH || "").split(delimiter)) {
    for (const name of PATH_NAMES) {
      const candidate = join(dir, name);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

/**
 * Render one URL and return { ok: true, browser, html } or { ok: false, reason, browser? }.
 * A fresh, throwaway profile every time: no cookies, no logins, nothing of the user's.
 */
export async function renderPage(url, browser = findBrowser()) {
  if (!browser) return { ok: false, reason: "no_browser" };
  const profile = mkdtempSync(join(tmpdir(), "vectorscope-render-"));
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--mute-audio",
    `--user-data-dir=${profile}`,
    `--virtual-time-budget=${RENDER_BUDGET_MS}`,
    "--dump-dom",
    url,
  ];
  try {
    const html = await new Promise((resolve, reject) => {
      const child = spawn(browser, args, { stdio: ["ignore", "pipe", "ignore"], windowsHide: true });
      const parts = [];
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error("timeout"));
      }, RENDER_TIMEOUT_MS);
      child.stdout.on("data", (data) => parts.push(data));
      child.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.on("close", () => {
        clearTimeout(timer);
        resolve(Buffer.concat(parts).toString("utf8"));
      });
    });
    if (!html.trim()) return { ok: false, reason: "empty_dom", browser };
    return { ok: true, browser, html };
  } catch (error) {
    return { ok: false, reason: error.message === "timeout" ? "timeout" : "launch_failed", browser };
  } finally {
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      // A profile the browser still holds is left for the OS to clean.
    }
  }
}
