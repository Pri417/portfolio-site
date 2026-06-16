// cs-builder.jsx
// Editing framework for the case-study page builder.
// - EditCtx: { edit, pageKey } shared across all blocks
// - Editable: inline contentEditable text bound to section state (commits on blur)
// - useSections: section list in React state, persisted to localStorage
// - SectionFrame: hover toolbar (move up/down, delete) shown in edit mode
// - AddSectionBar: inserter between sections with a type menu
// - CSVideo: YouTube / Vimeo / mp4 embed block
// Single source of truth: the sections array (text + structure) is persisted
// whole as JSON. Image-slots persist themselves by id (pageKey+section+key).

const EditCtx = React.createContext({ edit: true, pageKey: 'cs' });

// ─── id helpers ─────────────────────────────────────────────────────────
function uid(prefix = 's') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
function imgId(pageKey, sectionId, key) {
  return `${pageKey}__${sectionId}__${key}`;
}

// ─── Editable inline text ────────────────────────────────────────────────
// DOM-managed (we set innerHTML via ref) so React never fights the caret.
function Editable({ value, onCommit, tag = 'div', placeholder, style, className = '' }) {
  const { edit } = React.useContext(EditCtx);
  const ref = React.useRef(null);
  const Tag = tag;

  // A field cleared in contentEditable keeps a stray <br>/&nbsp;, which defeats
  // the :empty::before placeholder. Treat such content as truly empty so the
  // placeholder ("Body copy…", "Heading", etc.) shows.
  const blankish = (v) => !String(v == null ? '' : v)
    .replace(/<br\s*\/?>/gi, '').replace(/&nbsp;/gi, '').replace(/<[^>]*>/g, '').replace(/\s/g, '');

  // Sync DOM when the value changes from outside and we're not focused.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    const v = blankish(value) ? '' : String(value);
    if (el.innerHTML !== v) el.innerHTML = v;
  }, [value]);

  return (
    <Tag
      ref={ref}
      className={`cs-editable ${edit ? 'is-editing' : ''} ${className}`}
      contentEditable={edit}
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder || ''}
      onPaste={(e) => {
        // Force pasted content to plain text so it inherits this field's
        // preset styling instead of carrying the source's fonts/colours.
        e.preventDefault();
        const text = ((e.clipboardData || window.clipboardData).getData('text/plain') || '')
          .replace(/\r\n?/g, '\n');
        document.execCommand('insertText', false, text);
      }}
      onBlur={(e) => {
        const html = e.currentTarget.innerHTML;
        const out = blankish(html) ? '' : html;
        if (out !== html) e.currentTarget.innerHTML = '';
        onCommit(out);
      }}
      style={style}
    />
  );
}

// ─── sections state hook ─────────────────────────────────────────────────
// Section ids removed from the template — pruned from any stored copy on load
// so they neither resurrect nor linger as stale content in any browser.
const RETIRED_SECTION_IDS = ['concept-1', 'concept-2', 'ideation-head', 'introducing', 'research', 'features'];

function useSections(pageKey, defaults) {
  const key = `cs:${pageKey}:sections`;
  const deletedKey = `cs:${pageKey}:deleted`;
  // Section ids retired from the template — pruned from any browser's stored
  // copy on every load so removed sections never linger or resurrect.
  const RETIRED_IDS = RETIRED_SECTION_IDS;
  // User-deleted IDs (persisted so deleted sections never come back on reload)
  const getDeleted = () => { try { return JSON.parse(localStorage.getItem(deletedKey)) || []; } catch(e) { return []; } };
  const saveDeleted = (ids) => { try { localStorage.setItem(deletedKey, JSON.stringify(ids)); } catch(e) {} };
  // Reconcile stored sections against defaults: if a default section is a
  // password 'gate' but the stored copy of that id predates the gate (e.g. an
  // old 'intro'), upgrade it in place — keeping every other edit untouched.
  const migrate = (stored) => {
    const userDeleted = getDeleted();
    const allRetired = [...RETIRED_IDS, ...userDeleted];
    const mapped = stored
      .filter((s) => !allRetired.includes(s.id))
      .map((s) => {
        const def = defaults.find((d) => d.id === s.id);
        if (def && def.type === 'gate' && s.type !== 'gate') return { ...def };
        return s;
      });
    // Insert any NEW default sections (added since this browser last saved)
    // next to the default neighbour that precedes them — keeps every existing
    // edit intact while letting freshly-added sections show up.
    const has = (id) => mapped.some((s) => s.id === id);
    defaults.forEach((def, i) => {
      if (allRetired.includes(def.id)) return; // never re-inject user-deleted
      if (has(def.id)) return;
      const prevId = i > 0 ? defaults[i - 1].id : null;
      const at = prevId ? mapped.findIndex((s) => s.id === prevId) : -1;
      if (at >= 0) mapped.splice(at + 1, 0, { ...def });
      else mapped.push({ ...def });
    });
    return mapped;
  };
  const [sections, setSections] = React.useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return migrate(parsed);
      }
    } catch (e) { /* ignore */ }
    return defaults;
  });

  React.useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(sections)); } catch (e) { /* ignore */ }
  }, [key, sections]);

  const ops = React.useMemo(() => {
    const mark = () => {};
    return {
      add(type, index) {
        mark();
        setSections((prev) => {
          const n = [...prev];
          n.splice(index, 0, makeSection(type));
          return n;
        });
      },
      remove(id) {
        mark();
        // Persist this deletion so migrate() never re-injects it on reload
        const deleted = getDeleted();
        if (!deleted.includes(id)) saveDeleted([...deleted, id]);
        setSections((prev) => prev.filter((s) => s.id !== id));
      },
      move(id, dir) {
        mark();
        setSections((prev) => {
          const i = prev.findIndex((s) => s.id === id);
          if (i < 0) return prev;
          const j = i + dir;
          if (j < 0 || j >= prev.length) return prev;
          const n = [...prev];
          [n[i], n[j]] = [n[j], n[i]];
          return n;
        });
      },
      update(id, patch) {
        mark();
        setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
      },
      reset() {
        try { localStorage.removeItem(key); } catch (e) {}
        mark();
        setSections(defaults);
      },
      setAll(next) {
        if (Array.isArray(next)) { mark(); setSections(next); }
      },
    };
  }, [key, defaults]);

  return [sections, ops];
}

// ─── section type registry ───────────────────────────────────────────────
const SECTION_TYPES = [
  { type: 'intro',     label: 'Text intro',   icon: '¶' },
  { type: 'imageText', label: 'Image + text', icon: '▤' },
  { type: 'fullImage', label: 'Full image',   icon: '▭' },
  { type: 'gallery',   label: 'Gallery',      icon: '▦' },
  { type: 'carousel',  label: 'Carousel',     icon: '◧' },
  { type: 'video',     label: 'Video embed',  icon: '▷' },
  { type: 'quote',     label: 'Quote',        icon: '❝' },
  { type: 'process',   label: 'Process',      icon: '☰' },
  { type: 'insights',  label: 'Insights',     icon: '◳' },
  { type: 'metrics',   label: 'Metrics',      icon: '#' },
  { type: 'outcome',   label: 'Outcome',      icon: '↗' },
  { type: 'priorities',label: 'Priorities',   icon: '☷' },
  { type: 'insightCards',label: 'Insight cards', icon: '▤' },
  { type: 'conceptCards',label: 'Concept cards', icon: '▩' },
  { type: 'featureShowcase',label: 'Feature showcase', icon: '▦' },
];

function makeSection(type) {
  const id = uid('s');
  switch (type) {
    case 'intro':
      return { id, type, eyebrow: 'Overview', heading: 'Section heading goes here.',
        body: 'Start writing the story of this part of the project…', pullquote: '' };
    case 'imageText':
      return { id, type, side: 'left', eyebrow: 'Detail', heading: 'A heading for this moment.',
        body: 'Describe what is happening in the image and why it mattered.', rotate: -1.5 };
    case 'fullImage':
      return { id, type, caption: 'Add a caption…', height: 640 };
    case 'gallery':
      return { id, type, count: 4 };
    case 'carousel':
      return { id, type, count: 5, fit: 'cover', eyebrow: '', heading: '' };
    case 'video':
      return { id, type, url: '', caption: 'Add a caption…' };
    case 'quote':
      return { id, type, text: 'A short, sharp line that captures the work.',
        author: 'Name', role: 'Role' };
    case 'process':
      return { id, type, eyebrow: 'Process', heading: 'How it came together.',
        steps: [
          { title: 'First step', body: 'What happened in this phase.' },
          { title: 'Second step', body: 'What happened in this phase.' },
          { title: 'Third step', body: 'What happened in this phase.' },
        ] };
    case 'insights':
      return { id, type, eyebrow: 'Primary Research', heading: 'What we learned.',
        items: [
          { title: 'First insight', body: 'What we found.', quote: '', quoteBy: '', extension: '' },
          { title: 'Second insight', body: 'What we found.', quote: '', quoteBy: '', extension: '' },
          { title: 'Third insight', body: 'What we found.', quote: '', quoteBy: '', extension: '' },
        ] };
    case 'metrics':
      return { id, type, eyebrow: 'Results', heading: 'The outcome, in numbers.',
        note: '',
        items: [
          { value: '00%', label: 'What this number measures' },
          { value: '00',  label: 'What this number measures' },
          { value: '0x',  label: 'What this number measures' },
        ] };
    case 'outcome':
      return { id, type, heading: 'The Outcome',
        items: [
          { value: '1,500+', label: 'Global Sales Adoption:', body: 'Seamlessly integrated across the international sales force.' },
          { value: '8+',     label: 'Cross-Functional Synergy:', body: 'Unified leadership across IT, Sales, Training, and Finance.' },
          { value: '50%',    label: 'Operational Efficiency:', body: 'Eliminated redundant workflows and manual data entry.' },
        ] };
    case 'priorities':
      return { id, type, eyebrow: 'The approach', heading: 'Project Objective',
        lead: 'A one-line objective that frames what the project set out to do.',
        groups: [
          { tier: 'Must Have', items: [
            { icon: 'ai', label: 'First priority' },
            { icon: 'flow', label: 'Second priority' },
          ] },
          { tier: 'Should Have', items: [
            { icon: 'guest', label: 'A secondary priority' },
          ] },
          { tier: 'Nice to Have', items: [
            { icon: 'smile', label: 'A stretch goal' },
          ] },
        ] };
    case 'insightCards':
      return { id, type, eyebrow: 'Primary Research', heading: 'Key insights',
        cards: [
          { eyebrow: 'Insight 1', title: 'First insight', body: 'What we observed.', extension: 'Why it matters.' },
          { eyebrow: 'Insight 2', title: 'Second insight', body: 'What we observed.', extension: 'Why it matters.' },
          { eyebrow: 'Insight 3', title: 'Third insight', body: 'What we observed.', extension: 'Why it matters.' },
        ] };
    case 'conceptCards':
      return { id, type, eyebrow: 'Concepts', heading: 'Three directions',
        cards: [
          { eyebrow: 'Concept 1', title: 'First concept', body: 'Describe the concept.', pdf: '', btn: 'View PDF' },
          { eyebrow: 'Concept 2', title: 'Second concept', body: 'Describe the concept.', pdf: '', btn: 'View PDF' },
          { eyebrow: 'Concept 3', title: 'Third concept', body: 'Describe the concept.', pdf: '', btn: 'View PDF' },
        ] };
    case 'featureShowcase':
      return { id, type, heading: 'Tempo’s Features',
        apps: [
          { label: 'Feature one' },
          { label: 'Feature two' },
          { label: 'Feature three' },
        ],
        hw: [
          { name: 'TempoX', body: 'Describe this hardware.' },
          { name: 'TempoY', body: 'Describe this hardware.' },
          { name: 'TempoZ', body: 'Describe this hardware.' },
        ] };
    default:
      return { id, type };
  }
}

// ─── section frame (edit chrome) ─────────────────────────────────────────
function SectionFrame({ s, index, total, ops, children }) {
  const { edit } = React.useContext(EditCtx);
  if (!edit) return <>{children}</>;
  return (
    <div className="cs-frame">
      <div className="cs-frame-bar" contentEditable={false}>
        <span className="cs-frame-tag">{s.type}</span>
        <div className="cs-frame-actions">
          <button title="Move up" disabled={index === 0}
            onClick={() => ops.move(s.id, -1)}>↑</button>
          <button title="Move down" disabled={index === total - 1}
            onClick={() => ops.move(s.id, 1)}>↓</button>
          <button
            title="Group with adjacent sections (shared background)"
            style={{ color: s.bg ? 'var(--orange)' : undefined }}
            onClick={() => ops.update(s.id, s.bg
              ? { bg: null, tight: false }
              : { bg: 'var(--peach)', tight: true }
            )}>🔗 Group</button>
          <button title="Delete section" className="cs-del"
            onClick={() => { if (confirm('Delete this section?')) ops.remove(s.id); }}>✕</button>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── add-section inserter ────────────────────────────────────────────────
function AddSectionBar({ index, ops }) {
  const { edit } = React.useContext(EditCtx);
  const [open, setOpen] = React.useState(false);
  if (!edit) return null;
  return (
    <div className="cs-add" contentEditable={false}>
      <button className="cs-add-btn" onClick={() => setOpen((o) => !o)}>
        <span className="cs-add-plus">+</span> Add section
      </button>
      {open && (
        <div className="cs-add-menu">
          {SECTION_TYPES.map((t) => (
            <button key={t.type} onClick={() => { ops.add(t.type, index); setOpen(false); }}>
              <span className="cs-add-ic">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── video embed ─────────────────────────────────────────────────────────
function toEmbed(url) {
  if (!url) return null;
  const u = url.trim();
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return { kind: 'iframe', src: `https://www.youtube.com/embed/${m[1]}` };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { kind: 'iframe', src: `https://player.vimeo.com/video/${m[1]}` };
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(u)) return { kind: 'video', src: u };
  if (/^https?:\/\//.test(u)) return { kind: 'iframe', src: u };
  return null;
}

// Session-scoped store for dropped .mp4 files. An object URL only lives for
// the page session (it can't be persisted through the host bridge), so we
// keep it in a module map keyed by section id — survives React re-renders,
// resets on reload. To make a video permanent, drop the .mp4 into the
// project and put its path in the "Video URL" field (toEmbed renders any
// .mp4/.webm path as a native <video>).
const csVideoLocalFiles = {};

function CSVideo({ s, ops }) {
  const { edit } = React.useContext(EditCtx);
  const embed = toEmbed(s.url);
  const [local, setLocal] = React.useState(() => csVideoLocalFiles[s.id] || null);
  const [over, setOver] = React.useState(false);
  const inputRef = React.useRef(null);

  const ingest = (file) => {
    if (!file) return;
    if (!/^video\//.test(file.type) && !/\.(mp4|webm|ogg|mov|m4v)$/i.test(file.name || '')) return;
    const prev = csVideoLocalFiles[s.id];
    if (prev && prev.url) { try { URL.revokeObjectURL(prev.url); } catch (e) {} }
    const url = URL.createObjectURL(file);
    const rec = { url, name: file.name || 'video.mp4' };
    csVideoLocalFiles[s.id] = rec;
    setLocal(rec);
  };
  const clearLocal = () => {
    const prev = csVideoLocalFiles[s.id];
    if (prev && prev.url) { try { URL.revokeObjectURL(prev.url); } catch (e) {} }
    delete csVideoLocalFiles[s.id];
    setLocal(null);
  };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setOver(false);
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    ingest(f);
  };
  const dragProps = edit ? {
    onDragEnter: (e) => { e.preventDefault(); setOver(true); },
    onDragOver: (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; },
    onDragLeave: (e) => { e.preventDefault(); setOver(false); },
    onDrop,
  } : {};

  // Priority: a dropped local .mp4 wins over any saved URL.
  const showVideo = local ? { kind: 'video', src: local.url } : embed;

  return (
    <section className="reveal" style={{ padding: '64px 0' }}>
      <div className="cs-wrap">
        {edit && (
          <div className="cs-video-input" contentEditable={false}>
            <span className="cs-field-label">Video URL</span>
            <input
              type="text"
              defaultValue={s.url}
              placeholder="Drop an .mp4 below — or paste a YouTube / Vimeo / .mp4 link…"
              onBlur={(e) => ops.update(s.id, { url: e.target.value })}
            />
          </div>
        )}

        <div {...dragProps} style={{
          position: 'relative', width: '100%', aspectRatio: '16 / 9',
          maxWidth: s.maxW || undefined,
          marginLeft: s.maxW ? 'auto' : undefined, marginRight: s.maxW ? 'auto' : undefined,
          background: showVideo && showVideo.kind !== undefined && (showVideo.kind === 'iframe' || showVideo.kind === 'video') ? '#000' : 'var(--peach)',
          overflow: 'hidden',
          outline: over ? '3px solid var(--orange)' : 'none', outlineOffset: '-3px',
          boxShadow: '0 28px 50px rgba(46,37,34,0.16), 0 6px 12px rgba(46,37,34,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {showVideo && showVideo.kind === 'iframe' && (
            <iframe
              src={showVideo.src}
              title="Embedded video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            />
          )}
          {showVideo && showVideo.kind === 'video' && (
            <video key={showVideo.src} src={showVideo.src} controls playsInline
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
          )}
          {!showVideo && (
            <div
              onClick={edit ? () => inputRef.current && inputRef.current.click() : undefined}
              style={{
                textAlign: 'center', color: 'var(--ink-muted)', fontFamily: 'var(--font-ui)',
                padding: 24, cursor: edit ? 'pointer' : 'default', userSelect: 'none',
              }}>
              <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 14 }}>▷</div>
              {edit ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                    Drop an .mp4 here
                  </div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    or <u>browse files</u> · or paste a link above
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 15, fontWeight: 600 }}>No video set</div>
              )}
            </div>
          )}

          {edit && (local || embed) && (
            <div contentEditable={false} style={{
              position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, zIndex: 3,
            }}>
              <button type="button" onClick={() => inputRef.current && inputRef.current.click()}
                style={csVideoBtnStyle}>Replace</button>
              {local && (
                <button type="button" onClick={clearLocal} style={csVideoBtnStyle}>Remove</button>
              )}
            </div>
          )}

          <input ref={inputRef} type="file" accept="video/*,.mp4,.webm,.mov,.m4v" hidden
            onChange={(e) => { const f = e.target.files && e.target.files[0]; ingest(f); e.target.value = ''; }} />
        </div>

        {edit && local && (
          <div contentEditable={false} style={{
            marginTop: 10, fontFamily: 'var(--font-ui)', fontSize: 12.5, lineHeight: 1.5,
            color: 'var(--ink-muted)',
          }}>
            Previewing <strong>{local.name}</strong> — this preview clears on reload. To keep it,
            add the file to your project and put its path (e.g. <code>videos/clip.mp4</code>) in the field above.
          </div>
        )}

        <Editable
          tag="div"
          value={s.caption}
          onCommit={(html) => ops.update(s.id, { caption: html })}
          placeholder="Add a caption…"
          style={{
            marginTop: 14, fontFamily: 'var(--font-script)', fontSize: s.captionSize || 20,
            color: 'var(--ink-muted)',
          }}
        />
      </div>
    </section>
  );
}

const csVideoBtnStyle = {
  appearance: 'none', border: 0, borderRadius: 6, padding: '6px 11px', cursor: 'pointer',
  background: 'rgba(0,0,0,0.62)', color: '#fff', fontFamily: 'var(--font-ui)',
  fontSize: 11, fontWeight: 600, backdropFilter: 'blur(6px)',
};

// ─── per-field delete wrapper ────────────────────────────────────────────
// Wrap any text field or image. In edit mode shows a ✕ on hover; when removed
// shows a "+ add" chip to bring it back. In preview a removed field renders
// nothing, so the surrounding flex/grid gap closes up automatically.
function Deletable({ hidden, onHide, onShow, label = 'item', children, inline = false, style }) {
  const { edit } = React.useContext(EditCtx);
  if (hidden) {
    if (!edit) return null;
    return (
      <button className="cs-restore" contentEditable={false} onClick={onShow}>
        + add {label}
      </button>
    );
  }
  const Tag = inline ? 'span' : 'div';
  return (
    <Tag className="cs-removable" style={{ position: 'relative', display: inline ? 'inline-block' : 'block', ...(style || {}) }}>
      {edit && (
        <button className="cs-remove-x" contentEditable={false} title={`Delete ${label}`} onClick={onHide}>×</button>
      )}
      {children}
    </Tag>
  );
}

Object.assign(window, {
  EditCtx, Editable, useSections, SectionFrame, AddSectionBar,
  CSVideo, SECTION_TYPES, makeSection, uid, imgId, toEmbed, Deletable,
});
