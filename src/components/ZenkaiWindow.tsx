import { useState } from 'preact/hooks';

interface LedgerRow {
  rowNum: number;
  account: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Expense';
  opening: number;
  debits: number;
  credits: number;
}

const INITIAL_ROWS: LedgerRow[] = [
  { rowNum: 5, account: '1000', name: 'Cash at bank', type: 'Asset', opening: 164200, debits: 20356.95, credits: 18503.17 },
  { rowNum: 6, account: '1100', name: 'Accounts receivable', type: 'Asset', opening: 318750, debits: 32465.01, credits: 29142.77 },
  { rowNum: 7, account: '1200', name: 'Inventory', type: 'Asset', opening: 402300, debits: 133397.68, credits: 147069.45 },
  { rowNum: 8, account: '2000', name: 'Accounts payable', type: 'Liability', opening: -221480, debits: 66253.92, credits: 58249.47 },
  { rowNum: 9, account: '2500', name: 'Bank loan', type: 'Liability', opening: -250000, debits: 114286.22, credits: 119825.18 },
  { rowNum: 10, account: '3100', name: 'Retained earnings', type: 'Equity', opening: -413770, debits: 175227.28, credits: 571804.64 },
  { rowNum: 11, account: '5000', name: 'Cost of goods sold', type: 'Expense', opening: 0, debits: 221575.40, credits: 1107.88 },
  { rowNum: 12, account: '6000', name: 'Salaries and wages', type: 'Expense', opening: 0, debits: 183144.14, credits: 1004.04 },
];

const INCOME_ROWS = [
  { rowNum: 5, code: '4000', name: 'Product sales', category: 'Revenue', q3: 842500.0, q4: 918400.0 },
  { rowNum: 6, code: '4100', name: 'Service revenue', category: 'Revenue', q3: 312800.0, q4: 344120.0 },
  { rowNum: 7, code: '5000', name: 'Cost of goods sold', category: 'COGS', q3: -214900.0, q4: -220467.52 },
  { rowNum: 8, code: '6000', name: 'Salaries and wages', category: 'OpEx', q3: -178400.0, q4: -182140.1 },
  { rowNum: 9, code: '6100', name: 'Rent & facilities', category: 'OpEx', q3: -42000.0, q4: -42000.0 },
  { rowNum: 10, code: '6300', name: 'Software & infrastructure', category: 'OpEx', q3: -28450.0, q4: -31200.0 },
];

function fmtMoney(n: number): string {
  if (Math.abs(n) < 0.005) return '$0.00';
  const abs = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `($${abs})` : `$${abs}`;
}

export default function ZenkaiWindow() {
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

  const commitEdit = () => {
    if (!editing) return;
    const parsed = parseFloat(editing.raw.replace(/[^0-9.-]/g, ''));
    if (!Number.isNaN(parsed)) {
      setRows((prev) =>
        prev.map((r, i) => (i === editing.idx ? { ...r, [editing.field]: Math.max(0, parsed) } : r)),
      );
    }
    setEditing(null);
  };

  const handleApprove = () => {
    setRows((prev) =>
      prev.map((r) => (r.account === '5000' ? { ...r, debits: 221575.4, credits: 1107.88 } : r)),
    );
    setAgentStatus('approved');
    setSelectedCell({ ref: 'G11', formula: '=D11+E11-F11' });
  };

  const handleUndoAgent = () => {
    setRows(INITIAL_ROWS);
    setAgentStatus('pending');
  };

  return (
    <div class="app-window" role="region" aria-label="Interactive Zenkai desktop spreadsheet">
      <div class="win-titlebar">
        <div class="win-title-left">
          <svg width="16" height="16" viewBox="0 0 128 128" fill="none" aria-hidden="true" style="display:block;border-radius:2px;">
            <rect width="128" height="128" rx="14" fill="#151715" />
            <path d="M28 30H100V44L48 84H100V98H28V84L80 44H28V30Z" fill="#F6F5F0" />
            <rect x="84" y="20" width="24" height="24" fill="#16A368" />
          </svg>
          <span>Zenkai</span>
        </div>
        <div class="win-title-center mono">Trial_Balance_Sep_2026.xlsx</div>
        <div class="win-controls" aria-hidden="true">
          <span>─</span>
          <span>□</span>
          <span>✕</span>
        </div>
      </div>

      <div class="win-body">
        {/* LEFT: Full-Height Spaces Sidebar (matches themes.png) */}
        <aside class="win-sidebar" aria-label="Spaces sidebar">
          <div class="sb-actions">
            <div class="sb-action-row">
              <span>+ New workbook</span>
              <kbd>Ctrl+N</kbd>
            </div>
            <div class="sb-action-row">
              <span>⌕ Search file</span>
              <kbd>Ctrl+E</kbd>
            </div>
          </div>

          <div class="space-card sp-teal">
            <div class="space-head">
              <span>▾ Salary</span>
              <span>7</span>
            </div>
            <div class="space-files">
              <div class="space-file">
                Payroll_October_2026.xlsx
                <span>Salaries, 3 sheets</span>
              </div>
            </div>
          </div>

          <div class="space-card sp-blue">
            <div class="space-head">
              <span>▾ Finance</span>
              <span>2</span>
            </div>
            <div class="space-files">
              <div class="space-file">
                Budget_vs_Actual_FY2026.xlsx
                <span>Finance, not loaded, 11 KB</span>
              </div>
              <div class="space-file">
                Cash_Flow_Forecast_Q4.xlsx
                <span>Finance, 1 sheet</span>
              </div>
            </div>
          </div>

          <div class="space-card sp-green">
            <div class="space-head">
              <span>▾ Accounting</span>
              <span>1</span>
            </div>
            <div class="space-files">
              <div class="space-file">
                AR_Aging_Oct_2026.xlsx
                <span>Accounting, 2 sheets</span>
              </div>
            </div>
          </div>

          <div class="space-card sp-rust">
            <div class="space-head">
              <span>▾ Sales</span>
              <span>2</span>
            </div>
            <div class="space-files">
              <div class="space-file">
                Sales_Pipeline_2026.xlsx
                <span>Sales, 3 sheets</span>
              </div>
              <div class="space-file is-active">
                Trial_Balance_Sep_2026.xlsx
                <span>demo, 2 sheets</span>
              </div>
            </div>
          </div>

          <div class="space-card sp-purple">
            <div class="space-head">
              <span>▾ Operations</span>
              <span>3</span>
            </div>
            <div class="space-files">
              <div class="space-file">
                Inventory_Reorder_Report.xlsx
                <span>Operations, 1 sheet</span>
              </div>
            </div>
          </div>
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
              <span>Click any Debit / Credit cell to edit live</span>
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
                      Closing balances. Edit Debits or Credits to recalculate.
                    </td>
                    <td colSpan={7} class="zk-mhide">
                      Closing balances from the general ledger. Debits and credits must agree (edit E or F cells to test live IronCalc recalc).
                    </td>
                  </tr>
                  <tr class="row-tbl-head">
                    <td class="rn">4</td>
                    <td class="zk-mhide">Account</td>
                    <td>Account name</td>
                    <td class="zk-mhide">Type</td>
                    <td class="num zk-mhide">Opening</td>
                    <td class="num">Debits</td>
                    <td class="num">Credits</td>
                    <td class="num">Closing</td>
                  </tr>
                  {rows.map((r, idx) => {
                    const closing = r.opening + r.debits - r.credits;
                    const isEditingE = editing?.idx === idx && editing.field === 'debits';
                    const isEditingF = editing?.idx === idx && editing.field === 'credits';
                    const isProposedG11 = r.rowNum === 11 && agentStatus === 'pending';

                    return (
                      <tr key={r.account}>
                        <td class="rn">{r.rowNum}</td>
                        <td class="mono zk-mhide">{r.account}</td>
                        <td>{r.name}</td>
                        <td class="zk-mhide">{r.type}</td>
                        <td class="num zk-mhide">{r.opening === 0 ? '-' : fmtMoney(r.opening)}</td>
                        <td
                          class={`num is-editable ${selectedCell.ref === `E${r.rowNum}` ? 'cell-selected' : ''}`}
                          onClick={() => {
                            setSelectedCell({ ref: `E${r.rowNum}`, formula: String(r.debits) });
                            setEditing({ idx, field: 'debits', raw: String(r.debits) });
                          }}
                        >
                          {isEditingE ? (
                            <input
                              class="cell-editor"
                              type="text"
                              value={editing.raw}
                              autoFocus
                              onInput={(e) =>
                                setEditing({
                                  idx,
                                  field: 'debits',
                                  raw: (e.target as HTMLInputElement).value,
                                })
                              }
                              onBlur={commitEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEdit();
                                if (e.key === 'Escape') setEditing(null);
                              }}
                            />
                          ) : (
                            fmtMoney(r.debits)
                          )}
                        </td>
                        <td
                          class={`num is-editable ${selectedCell.ref === `F${r.rowNum}` ? 'cell-selected' : ''}`}
                          onClick={() => {
                            setSelectedCell({ ref: `F${r.rowNum}`, formula: String(r.credits) });
                            setEditing({ idx, field: 'credits', raw: String(r.credits) });
                          }}
                        >
                          {isEditingF ? (
                            <input
                              class="cell-editor"
                              type="text"
                              value={editing.raw}
                              autoFocus
                              onInput={(e) =>
                                setEditing({
                                  idx,
                                  field: 'credits',
                                  raw: (e.target as HTMLInputElement).value,
                                })
                              }
                              onBlur={commitEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEdit();
                                if (e.key === 'Escape') setEditing(null);
                              }}
                            />
                          ) : (
                            fmtMoney(r.credits)
                          )}
                        </td>
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
                    <td class="zk-mhide">Total</td>
                    <td>
                      <span class="zk-monly">Total</span>
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
                      <strong>Check: debits minus credits</strong>
                    </td>
                    <td class="zk-monly">
                      <strong>Check</strong>
                    </td>
                    <td colSpan={4} class="zk-mhide">
                      <span class={`badge-check ${isBalanced ? 'is-ok' : 'is-warn'}`}>
                        {isBalanced ? 'Balanced' : `Out of balance (${fmtMoney(totalDebits - totalCredits)})`}
                      </span>
                    </td>
                    <td colSpan={3} class="zk-monly">
                      <span class={`badge-check ${isBalanced ? 'is-ok' : 'is-warn'}`}>
                        {isBalanced ? 'Balanced' : `Out of balance (${fmtMoney(totalDebits - totalCredits)})`}
                      </span>
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
                    <td colSpan={4} class="zk-monly">Quarterly income statement summary.</td>
                    <td colSpan={6} class="zk-mhide">Quarterly income statement summary (linked to general ledger).</td>
                  </tr>
                  <tr class="row-tbl-head">
                    <td class="rn">4</td>
                    <td class="zk-mhide">Code</td>
                    <td>Line item</td>
                    <td class="zk-mhide">Group</td>
                    <td class="num">Q3 2026</td>
                    <td class="num">Q4 2026</td>
                    <td class="num">Variance</td>
                  </tr>
                  {INCOME_ROWS.map((item) => (
                    <tr key={item.code}>
                      <td class="rn">{item.rowNum}</td>
                      <td class="mono zk-mhide">{item.code}</td>
                      <td>{item.name}</td>
                      <td class="zk-mhide">{item.category}</td>
                      <td class="num">{fmtMoney(item.q3)}</td>
                      <td class="num">{fmtMoney(item.q4)}</td>
                      <td class="num">{fmtMoney(item.q4 - item.q3)}</td>
                    </tr>
                  ))}
                  <tr class="row-total">
                    <td class="rn">11</td>
                    <td class="zk-mhide">Net</td>
                    <td colSpan={2} class="zk-mhide">Operating income</td>
                    <td class="zk-monly">Operating income</td>
                    <td class="num">$691,550.00</td>
                    <td class="num">$786,712.38</td>
                    <td class="num">$95,162.38</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div class="win-tabs" role="tablist" aria-label="Workbook sheets">
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
              Trial balance
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
              Income statement
            </button>
          </div>
        </div>

        {/* RIGHT: Full-Height Optional Agent Panel */}
        <aside class="win-agent" aria-label="Optional Agent Panel">
          <div class="agent-head">
            <div>New conversation</div>
            <span>Trial_Balance_Sep…</span>
          </div>
          <div class="agent-body">
            <p class="agent-intro">
              Ask about the open workbook or ask for a change. Changes appear in the grid for your
              approval first, and <strong>Ctrl+Z</strong> undoes them. Nothing is saved for you.
            </p>
            <div class="agent-msg-user">
              Verify COGS closing balance in G11 and confirm the trial balance nets to zero.
            </div>
            <div class="agent-proposal">
              <div class="prop-kicker">
                <span>PROPOSED EDIT · G11</span>
                <span>{agentStatus === 'pending' ? '1 cell' : agentStatus}</span>
              </div>
              <div class="prop-diff">G11: =D11+E11-F11 → $220,467.52</div>
              {agentStatus === 'pending' ? (
                <div class="prop-actions">
                  <button class="prop-btn is-approve" type="button" onClick={handleApprove}>
                    Approve
                  </button>
                  <button
                    class="prop-btn"
                    type="button"
                    onClick={() => setAgentStatus('discarded')}
                  >
                    Discard
                  </button>
                </div>
              ) : (
                <div class="prop-actions">
                  <button class="prop-btn" type="button" onClick={handleUndoAgent}>
                    Undo (Ctrl+Z)
                  </button>
                </div>
              )}
            </div>
          </div>
          <div class="agent-composer">
            <div class="composer-placeholder">Ask a question or ask for a change</div>
            <div class="composer-meta">
              <span>Claude Code ▾ · Ask before changes ▾</span>
              <span class="composer-send" aria-hidden="true">↑</span>
            </div>
          </div>
        </aside>
      </div>

      <div class="win-statusbar">
        <div class="status-group">
          <span>
            Opened in <strong>23 ms</strong>
          </span>
          <span>Sum: {fmtMoney(totalDebits)}</span>
          <span class="zk-mhide">Count: {rows.length * 3}</span>
        </div>
        <div class="status-group">
          <span class="status-pill">Agents can edit</span>
          <span class="zk-mhide">150%</span>
        </div>
      </div>
    </div>
  );
}
