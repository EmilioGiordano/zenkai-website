// Resolves direct download links for the latest Zenkai GitHub release.
// Used at build time (static HTML) and again in the browser, so a new release
// shows up without redeploying the site. Falls back to the releases page.

export type OsKey = 'windows' | 'linux' | 'macos';

export interface ReleaseInfo {
  tag: string | null;
  assets: Partial<Record<OsKey, string>>;
}

export const REPO = 'EmilioGiordano/Zenkai';
export const REPO_URL = `https://github.com/${REPO}`;
export const RELEASES_URL = `${REPO_URL}/releases`;
export const LATEST_RELEASE_URL = `${RELEASES_URL}/latest`;

const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const CACHE_KEY = 'zenkai-latest-release';
const CACHE_TTL_MS = 30 * 60 * 1000;

// First match wins: prefer the Windows installer, then the portable zip.
const ASSET_PATTERNS: Record<OsKey, RegExp[]> = {
  windows: [/windows-x64-setup\.exe$/i, /windows.*\.exe$/i, /windows.*\.zip$/i],
  linux: [/linux-x64\.tar\.gz$/i, /linux.*\.(appimage|deb|tar\.gz)$/i],
  macos: [/macos-arm64\.tar\.gz$/i, /macos.*\.(dmg|zip|tar\.gz)$/i],
};

export const EMPTY_RELEASE: ReleaseInfo = { tag: null, assets: {} };

interface GithubAsset {
  name: string;
  browser_download_url: string;
}

function parseRelease(json: { tag_name?: string; assets?: GithubAsset[] }): ReleaseInfo {
  const assets: ReleaseInfo['assets'] = {};
  const list = json.assets ?? [];

  (Object.keys(ASSET_PATTERNS) as OsKey[]).forEach((os) => {
    for (const pattern of ASSET_PATTERNS[os]) {
      const hit = list.find((a) => pattern.test(a.name));
      if (hit) {
        assets[os] = hit.browser_download_url;
        break;
      }
    }
  });

  return { tag: json.tag_name ?? null, assets };
}

export function downloadHref(release: ReleaseInfo, os: OsKey): string {
  return release.assets[os] ?? LATEST_RELEASE_URL;
}

let pending: Promise<ReleaseInfo> | null = null;

export function fetchLatestRelease(): Promise<ReleaseInfo> {
  if (pending) return pending;

  pending = (async () => {
    const inBrowser = typeof window !== 'undefined';

    if (inBrowser) {
      try {
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null');
        if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.release as ReleaseInfo;
      } catch {
        // Storage unavailable
      }
    }

    try {
      const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
      // Optional at build time to avoid GitHub's anonymous rate limit; never exposed to the client.
      const token = inBrowser ? undefined : import.meta.env.GITHUB_TOKEN;
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(API_URL, { headers, signal: AbortSignal.timeout(6000) });
      if (!res.ok) return EMPTY_RELEASE;

      const release = parseRelease(await res.json());

      if (inBrowser) {
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), release }));
        } catch {
          // Storage unavailable
        }
      }
      return release;
    } catch {
      return EMPTY_RELEASE;
    }
  })();

  return pending;
}
