/**
 * cs-sidecar.js
 * Cross-device persistence for case-study pages.
 *
 * On every page load: fetches cs-state-{pageKey}.json and restores any
 * cs:{pageKey}:* keys that are missing from localStorage (fresh device).
 *
 * When csSidecarSave(pageKey) is called: writes all cs:{pageKey}:* keys
 * from localStorage back to cs-state-{pageKey}.json via window.omelette
 * (only available in the Omelette editor — silently no-ops elsewhere).
 *
 * Usage:
 *   <script src="cs-sidecar.js"></script>
 *   Then call: csSidecarRestore(pageKey).then(() => { mountReact(); })
 *   And:       csSidecarSave(pageKey)   // call whenever state changes
 */

(function () {
  // Pending save so rapid changes don't flood the API
  var saveTimer = null;
  var saving = false;
  var saveDirty = false;

  /**
   * Restore: fetch the project sidecar and populate localStorage with any
   * keys that are not already set (preserves local edits on the same device).
   * Returns a Promise that resolves when done (or immediately on failure).
   */
  window.csSidecarRestore = function (pageKey) {
    // NOTE: the host bridge only allows writes to *.state.json basenames, so the
    // sidecar MUST end in .state.json or the in-page Save is silently rejected.
    var file = 'cs-state-' + pageKey + '.state.json';
    return fetch(file, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || typeof data !== 'object') return;
        Object.keys(data).forEach(function (k) {
          // Always restore from file — the saved file is the source of truth.
          // This ensures edits saved to the project always load correctly,
          // even if localStorage has a stale/older version.
          try { localStorage.setItem(k, JSON.stringify(data[k])); } catch (e) {}
        });
      })
      .catch(function () { /* sidecar not found yet — that's fine */ });
  };

  /**
   * Restore THEN mount: guarantees the project sidecar has been pulled into
   * localStorage before the mount callback runs, so a fresh device/browser
   * never renders defaults before the saved state arrives. Use this to mount
   * every page instead of calling csSidecarRestore fire-and-forget.
   *   csMount('atlasone', () => ReactDOM.createRoot(el).render(<App/>));
   */
  window.csMount = function (pageKey, mountFn) {
    var p = window.csSidecarRestore
      ? window.csSidecarRestore(pageKey)
      : Promise.resolve();
    return p.then(function () { try { mountFn(); } catch (e) { console.error(e); } });
  };

  /**
   * Save: write all cs:{pageKey}:* localStorage keys to the sidecar file.
   * Requires window.omelette.writeFile (only available in the editor).
   */
  window.csSidecarSave = function (pageKey, extraPrefixes) {
    var w = window.omelette && window.omelette.writeFile;
    if (!w) return; // outside the editor — skip silently
    if (saving) { saveDirty = true; return; }
    var state = {};
    var prefixes = ['cs:' + pageKey + ':'].concat(Array.isArray(extraPrefixes) ? extraPrefixes : []);
    Object.keys(localStorage).forEach(function (k) {
      var match = prefixes.some(function (p) { return k.indexOf(p) === 0; });
      if (!match) return;
      // Skip history (large and device-local) to keep the sidecar lean
      if (k.indexOf(':history') !== -1) return;
      try { state[k] = JSON.parse(localStorage.getItem(k)); } catch (e) { state[k] = localStorage.getItem(k); }
    });
    saving = true;
    Promise.resolve(w('cs-state-' + pageKey + '.state.json', JSON.stringify(state)))
      .catch(function () {})
      .then(function () {
        saving = false;
        if (saveDirty) { saveDirty = false; window.csSidecarSave(pageKey); }
        // Broadcast "saved" so the toolbar indicator can show it
        window.dispatchEvent(new CustomEvent('cs-sidecar-saved', { detail: { pageKey: pageKey } }));
      });
  };

  /**
   * Auto-save: debounce writes so rapid edits don't flood the API.
   * Call this instead of csSidecarSave for change-driven saves.
   */
  window.csSidecarAutoSave = function (pageKey, delay, extraPrefixes) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { window.csSidecarSave(pageKey, extraPrefixes); }, delay || 2500);
  };
})();
