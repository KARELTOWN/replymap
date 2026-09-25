// Design tokens, floating button, capture toolbar and recording panel:
// everything the widget shows before a capture is taken.

export const shellCSS = `
:root {
  --bugreveal-brand: #465FFF;
  --bugreveal-brand-dark: #2e4de0;
  --bugreveal-text: #1a1d29;
  --bugreveal-text-muted: #6b7280;
  --bugreveal-border: #e5e7eb;
  --bugreveal-bg: #ffffff;
  --bugreveal-bg-subtle: #f8f9fc;
  --bugreveal-bg-sunken: #f1f3f9;
  --bugreveal-brand-soft: rgba(70, 95, 255, 0.08);
  --bugreveal-text-subtle: #9aa1ae;
  --bugreveal-danger: #ef4444;
  --bugreveal-success: #22c55e;
  --bugreveal-info: #3b82f6;
  --bugreveal-radius: 12px;
  --bugreveal-radius-sm: 8px;
  --bugreveal-radius-xs: 6px;
  --bugreveal-shadow: 0 10px 30px rgba(16, 24, 40, 0.12), 0 2px 6px rgba(16, 24, 40, 0.06);
  --bugreveal-shadow-lg: 0 24px 48px rgba(16, 24, 40, 0.18);
  --bugreveal-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

#bugreveal_fab,
#bugreveal_toolbar,
#bugreveal_recordPanel,
#bugreveal_capture-overlay,
#bugreveal_canvas-loader,
.bugreveal_toast {
  font-family: var(--bugreveal-font);
  box-sizing: border-box;
}

#bugreveal_fab *, #bugreveal_toolbar *, #bugreveal_recordPanel *,
#bugreveal_capture-overlay *, .bugreveal_toast * { box-sizing: border-box; }

/* --- Floating button --- */
#bugreveal_fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bugreveal-brand);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--bugreveal-shadow);
  z-index: 999998;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
#bugreveal_fab:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: var(--bugreveal-shadow-lg);
}
#bugreveal_fab svg { width: 26px; height: 26px; }

/* --- Floating capture toolbar --- */
#bugreveal_toolbar {
  position: fixed;
  bottom: 90px;
  right: 24px;
  background: var(--bugreveal-bg);
  border-radius: var(--bugreveal-radius);
  box-shadow: var(--bugreveal-shadow);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 999997;
  min-width: 220px;
  animation: bugreveal-pop-in 0.15s ease;
}
@keyframes bugreveal-pop-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
#bugreveal_toolbar button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: transparent;
  border: none;
  border-radius: var(--bugreveal-radius-sm);
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--bugreveal-text);
  cursor: pointer;
  transition: background-color 0.15s ease;
  text-align: left;
}
#bugreveal_toolbar button:hover { background: var(--bugreveal-bg-subtle); }
#bugreveal_toolbar button svg { width: 20px; height: 20px; flex-shrink: 0; fill: none; stroke: var(--bugreveal-brand); }
#bugreveal_toolbar .bugreveal_toolbar-primary { font-weight: 600; }
#bugreveal_toolbar .bugreveal_toolbar-divider {
  height: 1px;
  background: var(--bugreveal-border);
  margin: 4px 8px;
}

/* --- Recording panel --- */
#bugreveal_recordPanel {
  position: fixed;
  bottom: 24px;
  right: 96px;
  background: var(--bugreveal-bg);
  border-radius: 999px;
  box-shadow: var(--bugreveal-shadow);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 999998;
}
#bugreveal_recordPanel button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.15s ease;
}
#bugreveal_recordPanel button:hover { background: var(--bugreveal-bg-subtle); }
#bugreveal_recordPanel button svg { width: 24px; height: 24px; }
#bugreveal_btnRecordResume { display: none; }
#bugreveal_record-timer {
  font-size: 13px;
  font-weight: 600;
  color: var(--bugreveal-text);
  font-variant-numeric: tabular-nums;
}
#bugreveal_record-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bugreveal-danger);
  animation: bugreveal-blink 1.2s ease-in-out infinite;
}
@keyframes bugreveal-blink { 50% { opacity: 0.25; } }
`;
