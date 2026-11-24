import { useState, useEffect } from 'preact/hooks';
import { defaultLang, t, type Lang } from '../i18n/ui';

const ROWS_VISIBLE = 9;
const COLS_DESKTOP = 6;
const COLS_MOBILE = 3;
const MAX_ROW = 1_048_576 - (ROWS_VISIBLE - 1);

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

function cellValue(r: number, c: number, accounts: string[], locale: string): string {
  if (c === 0) return `ACC-${1000 + (r % 9000)}`;
  if (c === 1) return `${accounts[r % accounts.length]} #${r.toLocaleString(locale)}`;
  if (c % 5 === 4) {
    return `=SUM(${colName(Math.max(0, c - 2))}${r}:${colName(c - 1)}${r})`;
  }
  const val = ((r * 37 + c * 101) % 94500) + 125.4;
  return `$${val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function VirtualGridDemo({ lang = defaultLang }: { lang?: Lang }) {
  const dict = t(lang);
  const d = dict.grid;
  const locale = dict.numLocale;
  const fmt = (n: number) => n.toLocaleString(locale);

  const [startRow, setStartRow] = useState(1);
  const [startCol, setStartCol] = useState(0);
  const [colsVisible, setColsVisible] = useState(COLS_DESKTOP);
  const maxCol = 16_384 - colsVisible;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const sync = () => setColsVisible(mq.matches ? COLS_MOBILE : COLS_DESKTOP);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const updatePos = (nextR: number, nextC: number) => {
    setStartRow(Math.max(1, Math.min(MAX_ROW, nextR)));
    setStartCol(Math.max(0, Math.min(maxCol, nextC)));
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

  const cols = Array.from({ length: colsVisible }, (_, i) => startCol + i);
  const rows = Array.from({ length: ROWS_VISIBLE }, (_, i) => startRow + i);
  const anchorCol = colName(startCol);

  return (
    <div class="forge-shell">
      <div class="forge-topbar">
        <div class="forge-hud">
          <span class="hud-chip">
            {d.viewport} <strong>{anchorCol}{fmt(startRow)}</strong>
          </span>
          <span class="hud-chip hud-secondary">
            {d.drawn} <strong>{ROWS_VISIBLE} × {colsVisible}</strong>
          </span>
          <span class="hud-chip">
            {d.virtual} <strong>{d.virtualSize}</strong>
          </span>
        </div>

        <div class="forge-jumps">
          <button class="seg-btn" type="button" onClick={() => updatePos(1, 0)}>
            A1
          </button>
          <button class="seg-btn" type="button" onClick={() => updatePos(500_000, 701)}>
            ZZ{fmt(500_000)}
          </button>
          <button class="seg-btn" type="button" onClick={() => updatePos(MAX_ROW, maxCol)}>
            XFD{fmt(1_048_576)}
          </button>
        </div>
      </div>

      <div class="forge-stage">
        <div
          class="forge-grid-viewport"
          tabIndex={0}
          role="grid"
          aria-label={d.gridAria}
          onWheel={handleWheel}
        >
          <table class="forge-table">
            <thead>
              <tr>
                <th class="f-rn">{d.rowHeader}</th>
                {cols.map((c) => (
                  <th key={c}>{colName(c)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r}>
                  <td class="f-rn">{fmt(r)}</td>
                  {cols.map((c) => {
                    const isF = c % 5 === 4;
                    return (
                      <td key={c} class={isF ? 'is-formula' : ''}>
                        {cellValue(r, c, d.accounts, locale)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div class="v-rail" title={d.vRailTitle}>
          <input
            type="range"
            min={1}
            max={MAX_ROW}
            value={startRow}
            step={1}
            aria-label={d.vRailAria}
            onInput={(e) => updatePos(Number((e.target as HTMLInputElement).value), startCol)}
          />
        </div>
      </div>

      <div class="forge-bottombar">
        <span>
          {d.col} <strong>{anchorCol}</strong> ({fmt(startCol + 1)} / {d.colTotal})
        </span>
        <input
          type="range"
          min={0}
          max={maxCol}
          value={startCol}
          step={1}
          aria-label={d.hRailAria}
          onInput={(e) => updatePos(startRow, Number((e.target as HTMLInputElement).value))}
        />
        <span class="forge-hint">{d.hint}</span>
      </div>
    </div>
  );
}
