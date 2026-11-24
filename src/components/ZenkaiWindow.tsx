import { useState } from 'preact/hooks';
import { defaultLang, t, type Lang } from '../i18n/ui';

type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Expense';

interface LedgerRow {
  rowNum: number;
  account: string;
  /** Index into the translated account names. */
  nameIdx: number;
  type: AccountType;
  opening: number;
  debits: number;
  credits: number;
}

const INITIAL_ROWS: LedgerRow[] = [
  { rowNum: 5, account: '1000', nameIdx: 0, type: 'Asset', opening: 164200, debits: 20356.95, credits: 18503.17 },
  { rowNum: 6, account: '1100', nameIdx: 1, type: 'Asset', opening: 318750, debits: 32465.01, credits: 29142.77 },
  { rowNum: 7, account: '1200', nameIdx: 2, type: 'Asset', opening: 402300, debits: 133397.68, credits: 147069.45 },
  { rowNum: 8, account: '2000', nameIdx: 3, type: 'Liability', opening: -221480, debits: 66253.92, credits: 58249.47 },
  { rowNum: 9, account: '2500', nameIdx: 4, type: 'Liability', opening: -250000, debits: 114286.22, credits: 119825.18 },
  { rowNum: 10, account: '3100', nameIdx: 5, type: 'Equity', opening: -413770, debits: 175227.28, credits: 571804.64 },
  { rowNum: 11, account: '5000', nameIdx: 6, type: 'Expense', opening: 0, debits: 221575.40, credits: 10107.88 },
  { rowNum: 12, account: '6000', nameIdx: 7, type: 'Expense', opening: 0, debits: 183144.14, credits: 1004.04 },
];

type IncomeCategory = 'Revenue' | 'COGS' | 'OpEx';

const INCOME_ROWS: { rowNum: number; code: string; category: IncomeCategory; q3: number; q4: number }[] = [
  { rowNum: 5, code: '4000', category: 'Revenue', q3: 842500.0, q4: 918400.0 },
  { rowNum: 6, code: '4100', category: 'Revenue', q3: 312800.0, q4: 344120.0 },
  { rowNum: 7, code: '5000', category: 'COGS', q3: -214900.0, q4: -220467.52 },
  { rowNum: 8, code: '6000', category: 'OpEx', q3: -178400.0, q4: -182140.1 },
  { rowNum: 9, code: '6100', category: 'OpEx', q3: -42000.0, q4: -42000.0 },
  { rowNum: 10, code: '6300', category: 'OpEx', q3: -28450.0, q4: -31200.0 },
];

const INCOME_Q3 = INCOME_ROWS.reduce((s, r) => s + r.q3, 0);
const INCOME_Q4 = INCOME_ROWS.reduce((s, r) => s + r.q4, 0);

function makeMoneyFormatter(locale: string) {
  return (n: number): string => {
    const abs = Math.abs(n) < 0.005 ? 0 : Math.abs(n);
    const text = abs.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return n < -0.005 ? `($${text})` : `$${text}`;
  };
}

export default function ZenkaiWindow({ lang = defaultLang }: { lang?: Lang }) {
  const dict = t(lang);
  const w = dict.window;
  const fmtMoney = makeMoneyFormatter(dict.numLocale);

  const [rows, setRows] = useState<LedgerRow[]>(INITIAL_ROWS);
  const [activeTab, setActiveTab] = useState<'trial' | 'income'>('trial');
  const [selectedCell, setSelectedCell] = useState<{ ref: string; formula: string }>({
    ref: 'G13',
    formula: '=SUM(G5:G12)',
  });
  const [editing, setEditing] = useState<{ idx: number; field: 'debits' | 'credits'; raw: string } | null>(null);
  const [agentStatus, setAgentStatus] = useState<'pending' | 'approved' | 'discarded'>('pending');

  const totalDebits = rows.reduce((s, r) => s + r.debits, 0);
  const totalCredits = rows.reduce((s, r) => s + r.credits, 0);
  const totalClosing = rows.reduce((s, r) => s + (r.opening + r.debits - r.credits), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.02;
  const balanceLabel = isBalanced ? w.trial.balanced : w.trial.outOfBalance(fmtMoney(totalDebits - totalCredits));

  const commitEdit = () => {
    if (!editing) return;
    // Accept "1234.5" and "1.234,5" alike: the last separator is the decimal one.
    const raw = editing.raw.replace(/[^0-9.,-]/g, '');
    const lastSep = Math.max(raw.lastIndexOf('.'), raw.lastIndexOf(','));
    const normalized =
      lastSep === -1
        ? raw
        : raw.slice(0, lastSep).replace(/[.,]/g, '') + '.' + raw.slice(lastSep + 1);
    const parsed = parseFloat(normalized);
    if (!Number.isNaN(parsed)) {
      setRows((prev) =>
        prev.map((r, i) => (i === editing.idx ? { ...r, [editing.field]: Math.max(0, parsed) } : r)),
      );
    }
    setEditing(null);
  };

  const handleApprove = () => {
    setRows((prev) =>
      prev.map((r) => (r.account === '5000' ? { ...r, credits: 1107.88 } : r)),
    );
    setAgentStatus('approved');
    setSelectedCell({ ref: 'F11', formula: '1107.88' });
  };

  const handleUndoAgent = () => {
    setRows(INITIAL_ROWS);
    setAgentStatus('pending');
  };

  const statusLabel =
    agentStatus === 'pending' ? '' : agentStatus === 'approved' ? w.approved : w.discarded;

  const renderEditableCell = (r: LedgerRow, idx: number, field: 'debits' | 'credits', col: 'E' | 'F') => {
    const isEditing = editing?.idx === idx && editing.field === field;
    return (
      <td
        class={`num is-editable ${selectedCell.ref === `${col}${r.rowNum}` ? 'cell-selected' : ''}`}
        onClick={() => {
          setSelectedCell({ ref: `${col}${r.rowNum}`, formula: String(r[field]) });
          setEditing({ idx, field, raw: String(r[field]) });
        }}
      >
        {isEditing ? (
          <input
            class="cell-editor"
            type="text"
            value={editing.raw}
            autoFocus
            onInput={(e) => setEditing({ idx, field, raw: (e.target as HTMLInputElement).value })}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') setEditing(null);
            }}
          />
        ) : (
          fmtMoney(r[field])
        )}
      </td>
    );
  };

  return (
    <div class="app-window" role="region" aria-label={w.aria}>
      <div class="win-titlebar">
        <div class="win-title-left">
          <svg width="16" height="16" viewBox="0 0 128 128" fill="none" aria-hidden="true" style="display:block;border-radius:2px;">
            <rect width="128" height="128" rx="14" fill="#151715" />
            <path d="M28 30H100V44L48 84H100V98H28V84L80 44H28V30Z" fill="#F6F5F0" />
            <rect x="84" y="20" width="24" height="24" fill="#16A368" />
          </svg>
          <span>Zenkai</span>
        </div>
        <div class="win-title-center mono">{w.fileName}</div>
        <div class="win-controls" aria-hidden="true">
          <span>─</span>
          <span>□</span>
          <span>✕</span>
        </div>
      </div>

      <div class="win-body">
        {/* LEFT: Full-Height Spaces Sidebar */}
        <aside class="win-sidebar" aria-label={w.sidebarAria}>
          <div class="sb-actions">
            <div class="sb-action-row">
              <span>{w.newWorkbook}</span>
              <kbd>Ctrl+N</kbd>
            </div>
            <div class="sb-action-row">
              <span>{w.searchFile}</span>
              <kbd>Ctrl+E</kbd>
            </div>
          </div>

          {w.spaces.map((space) => (
            <div class={`space-card ${space.cls}`} key={space.cls}>
              <div class="space-head">
                <span>▾ {space.name}</span>
                <span>{space.files.length}</span>
              </div>
              <div class="space-files">
                {space.files.map(([file, meta]) => (
                  <div class={`space-file ${file === w.fileName ? 'is-active' : ''}`} key={file}>
                    {file}
                    <span>{meta}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* CENTER: Toolbar + Formula Bar (STRICTLY above sheet) + Editable Grid + Tabs */}
        <div class="win-center">
          <div class="win-toolbar" aria-hidden="true">
            <div class="tb-group">
              <span>↶</span>
              <span>↷</span>
            </div>
            <span class="tb-sep" />
            <div class="tb-group">
              <span class="tb-btn">B</span>
              <span class="tb-btn" style="font-style:italic">I</span>
              <span class="tb-btn" style="text-decoration:underline">U</span>
            </div>
            <span class="tb-sep" />
            <div class="tb-group">
              <span>$</span>
              <span>%</span>
              <span>.00</span>
            </div>
            <span class="tb-sep" />
            <div class="tb-group zk-mhide">
              <span>{w.toolbarHint}</span>
            </div>
          </div>

          <div class="win-formula-bar">
            <div class="fx-namebox">{selectedCell.ref}</div>
            <div class="fx-icon">fx</div>
            <div class="fx-input">{selectedCell.formula}</div>
          </div>

          <div class="grid-wrap">
            {activeTab === 'trial' ? (
              <table class="sheet-table">
                <colgroup>
                  <col class="col-rn" />
                  <col class="col-a zk-mhide" />
                  <col class="col-b" />
                  <col class="col-c zk-mhide" />
                  <col class="col-num zk-mhide" />
                  <col class="col-num" />
                  <col class="col-num" />
                  <col class="col-num" />
                </colgroup>
                <thead>
                  <tr>
                    <th />
                    <th class="zk-mhide">A</th>
                    <th>B</th>
                    <th class="zk-mhide">C</th>
                    <th class="zk-mhide">D</th>
                    <th>E</th>
                    <th>F</th>
                    <th>G</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="row-caption">
                    <td class="rn">2</td>
                    <td colSpan={4} class="zk-monly">
                      {w.trial.captionShort}
                    </td>
                    <td colSpan={7} class="zk-mhide">
                      {w.trial.captionLong}
                    </td>
                  </tr>
                  <tr class="row-tbl-head">
                    <td class="rn">4</td>
                    <td class="zk-mhide">{w.trial.account}</td>
                    <td>{w.trial.accountName}</td>
                    <td class="zk-mhide">{w.trial.type}</td>
                    <td class="num zk-mhide">{w.trial.opening}</td>
                    <td class="num">{w.trial.debits}</td>
                    <td class="num">{w.trial.credits}</td>
                    <td class="num">{w.trial.closing}</td>
                  </tr>
                  {rows.map((r, idx) => {
                    const closing = r.opening + r.debits - r.credits;
                    const isProposedG11 = r.rowNum === 11 && agentStatus === 'pending';

                    return (
                      <tr key={r.account}>
                        <td class="rn">{r.rowNum}</td>
                        <td class="mono zk-mhide">{r.account}</td>
                        <td>{w.trial.names[r.nameIdx]}</td>
                        <td class="zk-mhide">{w.trial.types[r.type]}</td>
                        <td class="num zk-mhide">{r.opening === 0 ? '-' : fmtMoney(r.opening)}</td>
                        {renderEditableCell(r, idx, 'debits', 'E')}
                        {renderEditableCell(r, idx, 'credits', 'F')}
                        <td
                          class={`num ${isProposedG11 ? 'cell-proposed' : ''}`}
                          onClick={() =>
                            setSelectedCell({
                              ref: `G${r.rowNum}`,
                              formula: `=D${r.rowNum}+E${r.rowNum}-F${r.rowNum}`,
                            })
                          }
                        >
                          {fmtMoney(closing)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr class="row-total">
                    <td class="rn">13</td>
                    <td class="zk-mhide">{w.trial.total}</td>
                    <td>
                      <span class="zk-monly">{w.trial.total}</span>
                    </td>
                    <td class="zk-mhide" />
                    <td class="num zk-mhide">-</td>
                    <td
                      class="num"
                      onClick={() => setSelectedCell({ ref: 'E13', formula: '=SUM(E5:E12)' })}
                    >
                      {fmtMoney(totalDebits)}
                    </td>
                    <td
                      class="num"
                      onClick={() => setSelectedCell({ ref: 'F13', formula: '=SUM(F5:F12)' })}
                    >
                      {fmtMoney(totalCredits)}
                    </td>
                    <td
                      class={`num ${selectedCell.ref === 'G13' ? 'cell-selected' : ''}`}
                      onClick={() => setSelectedCell({ ref: 'G13', formula: '=SUM(G5:G12)' })}
                    >
                      {fmtMoney(totalClosing)}
                    </td>
                  </tr>
                  <tr>
                    <td class="rn">14</td>
                    <td colSpan={3} class="zk-mhide">
                      <strong>{w.trial.checkLong}</strong>
                    </td>
                    <td class="zk-monly">
                      <strong>{w.trial.checkShort}</strong>
                    </td>
                    <td colSpan={4} class="zk-mhide">
                      <span class={`badge-check ${isBalanced ? 'is-ok' : 'is-warn'}`}>{balanceLabel}</span>
                    </td>
                    <td colSpan={3} class="zk-monly">
                      <span class={`badge-check ${isBalanced ? 'is-ok' : 'is-warn'}`}>{balanceLabel}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table class="sheet-table">
                <colgroup>
                  <col class="col-rn" />
                  <col class="col-a zk-mhide" />
                  <col class="col-b" />
                  <col class="col-c zk-mhide" />
                  <col class="col-num" />
                  <col class="col-num" />
                  <col class="col-num" />
                </colgroup>
                <thead>
                  <tr>
                    <th />
                    <th class="zk-mhide">A</th>
                    <th>B</th>
                    <th class="zk-mhide">C</th>
                    <th>D</th>
                    <th>E</th>
                    <th>F</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="row-caption">
                    <td class="rn">2</td>
                    <td colSpan={4} class="zk-monly">{w.income.captionShort}</td>
                    <td colSpan={6} class="zk-mhide">{w.income.captionLong}</td>
                  </tr>
                  <tr class="row-tbl-head">
                    <td class="rn">4</td>
                    <td class="zk-mhide">{w.income.code}</td>
                    <td>{w.income.lineItem}</td>
                    <td class="zk-mhide">{w.income.group}</td>
                    <td class="num">{w.income.q3}</td>
                    <td class="num">{w.income.q4}</td>
                    <td class="num">{w.income.variance}</td>
                  </tr>
                  {INCOME_ROWS.map((item, i) => (
                    <tr key={item.code}>
                      <td class="rn">{item.rowNum}</td>
                      <td class="mono zk-mhide">{item.code}</td>
                      <td>{w.income.names[i]}</td>
                      <td class="zk-mhide">{w.income.categories[item.category]}</td>
                      <td class="num">{fmtMoney(item.q3)}</td>
                      <td class="num">{fmtMoney(item.q4)}</td>
                      <td class="num">{fmtMoney(item.q4 - item.q3)}</td>
                    </tr>
                  ))}
                  <tr class="row-total">
                    <td class="rn">11</td>
                    <td class="zk-mhide">{w.income.net}</td>
                    <td colSpan={2} class="zk-mhide">{w.income.operatingIncome}</td>
                    <td class="zk-monly">{w.income.operatingIncome}</td>
                    <td class="num">{fmtMoney(INCOME_Q3)}</td>
                    <td class="num">{fmtMoney(INCOME_Q4)}</td>
                    <td class="num">{fmtMoney(INCOME_Q4 - INCOME_Q3)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div class="win-tabs" role="tablist" aria-label={w.tabsAria}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'trial'}
              class={`sheet-tab ${activeTab === 'trial' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveTab('trial');
                setSelectedCell({ ref: 'G13', formula: '=SUM(G5:G12)' });
              }}
            >
              {w.tabTrial}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'income'}
              class={`sheet-tab ${activeTab === 'income' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveTab('income');
                setSelectedCell({ ref: 'F11', formula: '=SUM(F5:F10)' });
              }}
            >
              {w.tabIncome}
            </button>
          </div>
        </div>

        {/* RIGHT: Full-Height Optional Agent Panel */}
        <aside class="win-agent" aria-label={w.agentAria}>
          <div class="agent-head">
            <div>{w.newConversation}</div>
            <span>{w.fileShort}</span>
          </div>
          <div class="agent-body">
            <p class="agent-intro">
              <strong>Ctrl+Z</strong> {w.agentIntroAfter}
            </p>
            <div class="agent-msg-user">{w.userMsg}</div>
            <div class="agent-proposal">
              <div class="prop-kicker">
                <span>{w.proposedEdit}</span>
                {statusLabel && <span>{statusLabel}</span>}
              </div>
              <div class="prop-diff">F11: {fmtMoney(10107.88)} → {fmtMoney(1107.88)}</div>
              <div class="prop-diff">G11: {fmtMoney(211467.52)} → {fmtMoney(220467.52)}</div>
              {agentStatus === 'pending' ? (
                <div class="prop-actions">
                  <button class="prop-btn is-approve" type="button" onClick={handleApprove}>
                    {w.approve}
                  </button>
                  <button
                    class="prop-btn"
                    type="button"
                    onClick={() => setAgentStatus('discarded')}
                  >
                    {w.discard}
                  </button>
                </div>
              ) : (
                <div class="prop-actions">
                  <button class="prop-btn" type="button" onClick={handleUndoAgent}>
                    {w.undo}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div class="agent-composer">
            <div class="composer-placeholder">{w.composer}</div>
            <div class="composer-meta">
              <span class="composer-picks">
                {w.composerMeta.map((label) => (
                  <span class="composer-pick">
                    {label}
                    <svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" /></svg>
                  </span>
                ))}
              </span>
              <span class="composer-send" aria-hidden="true">↑</span>
            </div>
          </div>
        </aside>
      </div>

      <div class="win-statusbar">
        <div class="status-group">
          <span>
            {w.openedIn} <strong>23 ms</strong>
          </span>
          <span>{w.sum} {fmtMoney(totalDebits)}</span>
          <span class="zk-mhide">{w.count} {rows.length * 3}</span>
        </div>
        <div class="status-group">
          <span class="status-pill">{w.agentsCanEdit}</span>
          <span class="zk-mhide">150%</span>
        </div>
      </div>
    </div>
  );
}
