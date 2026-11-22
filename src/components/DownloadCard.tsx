import { useState } from 'preact/hooks';

type OsKey = 'windows' | 'linux' | 'macos';

const RELEASES_URL = 'https://github.com/EmilioGiordano/Zenkai/releases';
const REPO_URL = 'https://github.com/EmilioGiordano/Zenkai';

interface OsOption {
  key: OsKey;
  label: string;
  badge?: string;
  ctaLabel: string;
  requirement: string;
  note: string;
  commandLabel: string;
  command: string;
}

const OS_OPTIONS: OsOption[] = [
  {
    key: 'windows',
    label: 'Windows',
    ctaLabel: 'Download Zenkai for Windows',
    requirement: 'Windows 10 / Windows 11 · x64 · Primary Platform (Rust + GPUI)',
    note: 'Unsigned early Windows build: SmartScreen may ask on first launch—click “More info” → “Run anyway”.',
    commandLabel: 'Or build from source (Rust)',
    command: 'git clone https://github.com/EmilioGiordano/Zenkai.git && cd Zenkai && cargo run --release',
  },
  {
    key: 'linux',
    label: 'Linux',
    badge: 'experimental',
    ctaLabel: 'View Linux Releases on GitHub',
    requirement: 'Linux x64 · Experimental build · Native GPUI',
    note: 'Windows is the main target today; Linux builds are published as experimental releases on GitHub.',
    commandLabel: 'Build from source (Rust)',
    command: 'git clone https://github.com/EmilioGiordano/Zenkai.git && cd Zenkai && cargo run --release',
  },
  {
    key: 'macos',
    label: 'macOS',
    badge: 'Apple Silicon',
    ctaLabel: 'View macOS Releases on GitHub',
    requirement: 'macOS · Apple Silicon (arm64) · Experimental build',
    note: 'Windows is the main target today; Apple Silicon builds are published as experimental previews.',
    commandLabel: 'Build from source (Rust)',
    command: 'git clone https://github.com/EmilioGiordano/Zenkai.git && cd Zenkai && cargo run --release',
  },
];

export default function DownloadCard() {
  const [os, setOs] = useState<OsKey>('windows');
  const [copied, setCopied] = useState(false);

  const current = OS_OPTIONS.find((item) => item.key === os) ?? OS_OPTIONS[0];

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(current.command);
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
          <span class="version-badge">Apache-2.0</span>
          <span class="license-note">Free &amp; open source · Local desktop spreadsheet</span>
        </div>

        <div class="layout-switcher" role="tablist" aria-label="Choose operating system">
          {OS_OPTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={os === item.key}
              class={`seg-btn ${os === item.key ? 'is-active' : ''}`}
              onClick={() => {
                setOs(item.key);
                setCopied(false);
              }}
            >
              {item.label}
              {item.badge && <span class="os-soon-tag"> · {item.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div class="download-card-actions">
        <a
          href={RELEASES_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-primary"
        >
          {current.ctaLabel}
        </a>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost btn-sm"
        >
          View source on GitHub
        </a>
      </div>

      <div class="download-meta-block">
        <span class="download-req">{current.requirement}</span>
        <span class="download-subnote">{current.note}</span>
      </div>

      <div class="download-command-wrap" role="tabpanel" aria-label={`${current.label} source command`}>
        <span class="command-kicker">{current.commandLabel}</span>
        <div class="download-command-box">
          <div class="command-line">
            <span class="command-prompt" aria-hidden="true">$</span>
            <code>{current.command}</code>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-sm copy-btn"
            onClick={handleCopy}
            aria-label={`Copy ${current.label} build command`}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <span class="sr-only" aria-live="polite">
            {copied ? 'Copied command to clipboard' : ''}
          </span>
        </div>
      </div>

      <p class="download-privacy">
        Runs 100% locally on your machine. No account, no cloud sync, no telemetry.
      </p>
    </div>
  );
}
