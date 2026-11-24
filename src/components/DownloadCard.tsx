import { useEffect, useState } from 'preact/hooks';
import {
  EMPTY_RELEASE,
  RELEASES_URL,
  REPO_URL,
  downloadHref,
  fetchLatestRelease,
  type OsKey,
  type ReleaseInfo,
} from '../lib/release';
import { defaultLang, t, type Lang } from '../i18n/ui';

const OS_KEYS: OsKey[] = ['windows', 'linux', 'macos'];
const OS_LABELS: Record<OsKey, string> = { windows: 'Windows', linux: 'Linux', macos: 'macOS' };
const BUILD_COMMAND =
  'git clone https://github.com/EmilioGiordano/Zenkai.git && cd Zenkai && cargo run --release';

interface Props {
  initialRelease?: ReleaseInfo;
  lang?: Lang;
}

export default function DownloadCard({ initialRelease = EMPTY_RELEASE, lang = defaultLang }: Props) {
  const d = t(lang).download;
  const [os, setOs] = useState<OsKey>('windows');
  const [copied, setCopied] = useState(false);
  const [release, setRelease] = useState<ReleaseInfo>(initialRelease);

  // Refresh in the browser so a new release is picked up without redeploying the site.
  useEffect(() => {
    fetchLatestRelease().then((latest) => {
      if (latest.tag) setRelease(latest);
    });
  }, []);

  const current = d.os[os];
  const label = OS_LABELS[os];
  const directUrl = release.assets[os];

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(BUILD_COMMAND);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div class="download-card">
      <div class="download-card-top">
        <div class="download-version-row">
          {release.tag && <span class="version-badge">{release.tag}</span>}
          <span class="version-badge">AGPL-3.0</span>
          <span class="license-note">{d.license}</span>
        </div>

        <div class="layout-switcher" role="tablist" aria-label={d.osAria}>
          {OS_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={os === key}
              class={`seg-btn ${os === key ? 'is-active' : ''}`}
              onClick={() => {
                setOs(key);
                setCopied(false);
              }}
            >
              {OS_LABELS[key]}
              {d.os[key].badge && <span class="os-soon-tag">{d.os[key].badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div class="download-card-actions">
        {directUrl ? (
          <a href={downloadHref(release, os)} class="btn btn-primary" download>
            {current.cta}
          </a>
        ) : (
          <a
            href={downloadHref(release, os)}
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-primary"
          >
            {current.fallback}
          </a>
        )}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost btn-sm"
        >
          {d.viewSource}
        </a>
        <a
          href={RELEASES_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost btn-sm"
        >
          {d.allReleases}
        </a>
      </div>

      <div class="download-meta-block">
        <span class="download-req">{current.requirement}</span>
        {current.note && <span class="download-subnote">{current.note}</span>}
      </div>

      <div class="download-command-wrap" role="tabpanel" aria-label={d.commandAria(label)}>
        <span class="command-kicker">{current.commandLabel}</span>
        <div class="download-command-box">
          <div class="command-line">
            <span class="command-prompt" aria-hidden="true">$</span>
            <code>{BUILD_COMMAND}</code>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-sm copy-btn"
            onClick={handleCopy}
            aria-label={d.copyAria(label)}
          >
            {copied ? d.copied : d.copy}
          </button>
          <span class="sr-only" aria-live="polite">
            {copied ? d.copiedSr : ''}
          </span>
        </div>
      </div>

      <p class="download-privacy">{d.privacy}</p>
      {os === 'windows' && <p class="download-signnote">{d.signNote}</p>}
    </div>
  );
}
