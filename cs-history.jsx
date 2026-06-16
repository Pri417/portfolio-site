// cs-history.jsx
// Version history + recovery for the case-study builder.
//
// Captures the FULL editable state of a page (hero, meta, next, sections) into
// a ring buffer in localStorage (`cs:<pageKey>:history`). A restore point is
// saved automatically a few seconds after edits settle, plus on demand and
// right before any restore — so rolling back is itself undoable.
//
// Exposes: useVersionHistory() hook + <HistoryPanel /> UI, attached to window.

function relTime(t) {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 10) return 'just now';
  if (s < 60) return s + 's ago';
  const m = Math.round(s / 60);
  if (m < 60) return m + (m === 1 ? ' min ago' : ' mins ago');
  const h = Math.round(m / 60);
  if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
  const d = Math.round(h / 24);
  return d + (d === 1 ? ' day ago' : ' days ago');
}

function clockLabel(t) {
  try {
    return new Date(t).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch (e) { return ''; }
}

// live = { hero, meta, next, sections } (current React state)
// applySnapshot(data) = writes a snapshot's data back into page state + storage
function useVersionHistory(pageKey, live, applySnapshot, { max = 40, debounceMs = 3500 } = {}) {
  const key = `cs:${pageKey}:history`;
  const [snapshots, setSnapshots] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; }
  });

  const liveRef = React.useRef(live);
  liveRef.current = live;

  const write = React.useCallback((arr) => {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) { /* quota */ }
  }, [key]);

  const snapshotNow = React.useCallback((label = '') => {
    const json = JSON.stringify(liveRef.current);
    setSnapshots((prev) => {
      // Skip if identical to the most recent snapshot's data.
      if (prev.length && JSON.stringify(prev[0].data) === json) return prev;
      const entry = { t: Date.now(), label, data: JSON.parse(json) };
      const arr = [entry, ...prev].slice(0, max);
      write(arr);
      return arr;
    });
  }, [max, write]);

  // Auto-capture a restore point once edits settle.
  React.useEffect(() => {
    const id = setTimeout(() => snapshotNow('auto'), debounceMs);
    return () => clearTimeout(id);
  }, [live.hero, live.meta, live.next, live.sections, debounceMs, snapshotNow]);

  const restore = React.useCallback((entry) => {
    snapshotNow('before restore'); // current state stays recoverable
    applySnapshot(entry.data);
  }, [applySnapshot, snapshotNow]);

  const remove = React.useCallback((t) => {
    setSnapshots((prev) => { const arr = prev.filter((s) => s.t !== t); write(arr); return arr; });
  }, [write]);

  const clear = React.useCallback(() => { setSnapshots([]); write([]); }, [write]);

  return { snapshots, snapshotNow, restore, remove, clear };
}

function HistoryPanel({ snapshots, onRestore, onSnapshot, onRemove, onClose }) {
  const [confirmIdx, setConfirmIdx] = React.useState(-1);
  return (
    <div className="cs-hist" contentEditable={false}>
      <div className="cs-hist-head">
        <div className="cs-hist-title">Version history</div>
        <button className="cs-hist-x" onClick={onClose} title="Close">×</button>
      </div>
      <p className="cs-hist-note">
        Restore points save automatically as you edit. Pick one to roll the whole
        page back — your current state is saved first, so you can always come back.
      </p>
      <button className="cs-hist-save" onClick={onSnapshot}>+ Save a restore point now</button>
      <div className="cs-hist-list">
        {snapshots.length === 0 && (
          <p className="cs-hist-empty">No restore points yet — keep editing and they’ll appear here.</p>
        )}
        {snapshots.map((s, i) => (
          <div key={s.t} className="cs-hist-row">
            <div className="cs-hist-info">
              <div className="cs-hist-when">
                {relTime(s.t)}
                {s.label === 'before restore' && <span className="cs-hist-tag">pre-restore</span>}
                {s.label === 'manual' && <span className="cs-hist-tag">saved</span>}
              </div>
              <div className="cs-hist-sub">
                {clockLabel(s.t)} · {(s.data.sections || []).length} sections
              </div>
            </div>
            <div className="cs-hist-actions">
              {confirmIdx === i ? (
                <React.Fragment>
                  <button className="cs-hist-go" onClick={() => { onRestore(s); onClose(); }}>Confirm</button>
                  <button className="cs-hist-cancel" onClick={() => setConfirmIdx(-1)}>Cancel</button>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <button className="cs-hist-restore" onClick={() => setConfirmIdx(i)}>Restore</button>
                  <button className="cs-hist-del" title="Delete this point" onClick={() => onRemove(s.t)}>×</button>
                </React.Fragment>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { useVersionHistory, HistoryPanel, csRelTime: relTime });
