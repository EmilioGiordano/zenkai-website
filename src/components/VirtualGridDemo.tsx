import { useState, useRef } from 'preact/hooks';

const ROWS_VISIBLE = 9;
const COLS_VISIBLE = 6;
const MAX_ROW = 1_048_576 - (ROWS_VISIBLE - 1);
const MAX_COL = 16_384 - COLS_VISIBLE;

const ACCOUNTS = [
  'Cash',
  'AR',
  'Inventory',
  'Payables',
  'COGS',
  'Payroll',
  'Rent',
  'Software',
  'Freight',
];

function colName(idx: number): string {
  let n = idx + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function cellValue(r: number, c: number): string {
  if (c === 0) return `ACC-${1000 + (r % 9000)}`;
  if (c === 1) return `${ACCOUNTS[r % ACCOUNTS.length]} #${r.toLocaleString('en-US')}`;
  if (c % 5 === 4) {
    return `=SUM(${colName(Math.max(0, c - 2))}${r}:${colName(c - 1)}${r})`;
  }
  const val = (((r * 37 + c * 101) % 94500) + 125.4).toFixed(2);
  return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export default function VirtualGridDemo() {
  const [startRow, setStartRow] = useState(1);
  const [startCol, setStartCol] = useState(0);
  const [frameMs, setFrameMs] = useState('0.4');
  const lastStamp = useRef<number>(0);

  const updatePos = (nextR: number, nextC: number) => {
    const t0 = performance.now();
    setStartRow(Math.max(1, Math.min(MAX_ROW, nextR)));
    setStartCol(Math.max(0, Math.min(MAX_COL, nextC)));
    const dt = lastStamp.current ? Math.min(16.6, Math.max(0.2, performance.now() - t0)) : 0.4;
    lastStamp.current = t0;
    setFrameMs(dt.toFixed(1));
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const dx = e.shiftKey ? e.deltaY : e.deltaX;
      const colStep = Math.sign(dx) * Math.max(2, Math.round(Math.abs(dx) / 5));
      updatePos(startRow, startCol + colStep);
    } else {
      const rowStep = Math.sign(e.deltaY) * Math.max(24, Math.round(Math.abs(e.deltaY) * 26));
      updatePos(startRow + rowStep, startCol);
    }
  };

  const cols = Array.from({ length: COLS_VISIBLE }, (_, i) => startCol + i);
  const rows = Array.from({ length: ROWS_VISIBLE }, (_, i) => startRow + i);
  const anchorCol = colName(startCol);

  return (
    <div class="forge-shell">
      <div class="forge-topbar">
        <div class="forge-hud">
          <span class="hud-chip">
            Viewport <strong>{anchorCol}{startRow.toLocaleString('en-US')}</strong>
          </span>
          <span class="hud-chip">
            Drawn <strong>{ROWS_VISIBLE} × {COLS_VISIBLE}</strong>
          </span>
          <span class="hud-chip">
            Virtual <strong>1,048,576 × 16,384</strong>
          </span>
          <span class="hud-chip">
            Render <strong>{frameMs} ms · 60 fps</strong>
          </span>
        </div>

        <div class="forge-jumps">
          <button
            class="seg-btn"
            type="button"
            onClick={() => updatePos(1, 0)}
          >
            A1
          </button>
          <button
            class="seg-btn"
            type="button"
            onClick={() => updatePos(500_000, 701)}
          >
            ZZ500,000
          </button>
          <button
            class="seg-btn"
            type="button"
            onClick={() => updatePos(MAX_ROW, MAX_COL)}
          >
            XFD1,048,576
          </button>
        </div>
      </div>

      <div class="forge-stage">
        <div
          class="forge-grid-viewport"
          tabIndex={0}
          role="grid"
          aria-label="Interactive virtual grid across 1,048,576 rows and 16,384 columns"
          onWheel={handleWheel}
        >
          <table class="forge-table">
            <thead>
              <tr>
                <th class="f-rn">Row</th>
                {cols.map((c) => (
                  <th key={c}>{colName(c)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r}>
                  <td class="f-rn">{r.toLocaleString('en-US')}</td>
                  {cols.map((c) => {
                    const isF = c % 5 === 4;
                    return (
                      <td key={c} class={isF ? 'is-formula' : ''}>
                        {cellValue(r, c)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div class="v-rail" title="Scrub vertically across 1,048,576 rows">
          <input
            type="range"
            min={1}
            max={MAX_ROW}
            value={startRow}
            step={1}
            aria-label="Vertical row scrubber (1 to 1,048,576)"
            onInput={(e) => updatePos(Number((e.target as HTMLInputElement).value), startCol)}
          />
        </div>
      </div>

      <div class="forge-bottombar">
        <span>
          Col <strong>{anchorCol}</strong> ({(startCol + 1).toLocaleString('en-US')} / 16,384)
        </span>
        <input
          type="range"
          min={0}
          max={MAX_COL}
          value={startCol}
          step={1}
          aria-label="Horizontal column scrubber (A to XFD)"
          onInput={(e) => updatePos(startRow, Number((e.target as HTMLInputElement).value))}
        />
        <span>Wheel = rows · Shift + Wheel = columns</span>
      </div>
    </div>
  );
}
