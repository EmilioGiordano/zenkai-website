# Zenkai Web

Official landing page for **[Zenkai](https://github.com/EmilioGiordano/Zenkai)** — a fast, native, open-source desktop spreadsheet written in **Rust + GPUI** with **IronCalc**.

Built with **Astro + Preact + TypeScript**, featuring:
- Interactive 3-pane Zenkai desktop window (editable cells with live `=SUM(...)` and `Balanced` recalculation, Spaces sidebar, and optional Agent Panel approval flow)
- Interactive 60 fps virtualized `1,048,576 × 16,384` grid scrubber
- Bring-your-own AI providers (`Claude Code`, `Codex`, `OpenCode`, `Grok`)
- Dual **Cerulean (Light)** and **Starlight (Dark)** themes with zero-FOUC persistence

## Development

```powershell
npm.cmd install
npm.cmd run dev
```

## Verification & Production Build

```powershell
npm.cmd run check
npm.cmd run build
```

## License

Apache-2.0 — see artwork attributions in [CREDITS.md](./CREDITS.md).
