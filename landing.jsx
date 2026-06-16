// landing.jsx — Pri Jain landing page (Bugaki/Klein-inspired type system).
// Cream bg · centered nav with logo placeholder · centered "Heyy, I'm Pri"
// · big "Graphic & Experience Designer" headline · 3 scattered photo placeholders
// · custom cursor labels "Featured work" in the work section · 4 big blank
//   card placeholders that stack/unstack.

// ──── PALETTE ────────────────────────────────────────────────────────────
const C = {
  bg: '#FAF3E8', // cream
  peach: '#F6E5DC', // soft peach
  orange: '#E63E1E', // headline / accent
  pink: '#E6336B', // hot raspberry
  burgundy: '#6B0A20', // deep dark
  softPink: '#FFCBD5',
  lavender: '#C4B5E0',
  ink: '#2E2522',
  inkSoft: '#5b4f48',
  inkMuted: '#998b82',
  border: '#ead9c8',
  card: '#ffffff'
};

// ──── DELETE / RESTORE (persisted curation) ────────────────────────────────
// useRemovable keeps a Set of removed item-ids in localStorage so the user's
// curation survives reload. Removing an item simply stops rendering it — so the
// surrounding flex / grid / stack closes the gap and re-flows automatically.
function useRemovable(storeKey) {
  const KEY = 'rm:' + storeKey;
  const [removed, setRemoved] = React.useState(() => {
    try {return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));}
    catch (e) {return new Set();}
  });
  React.useEffect(() => {
    try {localStorage.setItem(KEY, JSON.stringify([...removed]));} catch (e) {}
  }, [KEY, removed]);
  const remove = React.useCallback((id) => setRemoved((p) => {const n = new Set(p);n.add(id);return n;}), []);
  const restoreAll = React.useCallback(() => setRemoved(new Set()), []);
  return { removed, remove, restoreAll, count: removed.size };
}

// Hover-reveal "×" button. Drop inside any position:relative element. The CSS
// (.cs-removable:hover > .cs-remove-x) handles the reveal; pass extra styling
// via `style` to nudge its position inside framed items.
function DeleteDot({ onDelete, label = 'item', style }) {
  const edit = React.useContext(window.PageEditCtx || React.createContext(true));
  if (!edit) return null;
  return (
    <button
      className="cs-remove-x"
      contentEditable={false}
      title={`Delete ${label}`}
      onMouseDown={(e) => {e.preventDefault();e.stopPropagation();}}
      onClick={(e) => {e.preventDefault();e.stopPropagation();onDelete();}}
      style={style}>×</button>);

}

// Wrapper for items laid out in flow/grid: a relative box that reveals the ×.
function Removable({ onDelete, label, children, className = '', style, dotStyle }) {
  return (
    <div className={`cs-removable ${className}`} style={{ position: 'relative', ...(style || {}) }}>
      <DeleteDot onDelete={onDelete} label={label} style={dotStyle} />
      {children}
    </div>);

}

// Small chip shown when a collection has removed items — brings them all back.
function RestoreChip({ count, onRestore, style }) {
  const edit = React.useContext(window.PageEditCtx || React.createContext(true));
  if (!count || !edit) return null;
  return (
    <button className="cs-restore" onClick={onRestore} style={style}>
      ↺ restore removed ({count})
    </button>);

}

// ──── EDITABLE COLLECTIONS (add / remove / edit, persisted) ─────────────────
const uid = (p = 'i') => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

// A list of items in React state, persisted whole to localStorage. Supports
// add / remove / update(text edits) / moveToFront (stack) / reset-to-defaults.
function useCollection(storeKey, defaults) {
  const KEY = 'col:' + storeKey;
  const [items, setItems] = React.useState(() => {
    try { const r = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(r)) return r; } catch (e) {}
    return defaults;
  });
  React.useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} }, [KEY, items]);
  const api = React.useMemo(() => ({
    add: (item = {}) => setItems((p) => [...p, { id: uid(), ...item }]),
    addAt: (item, index) => setItems((p) => { const n = [...p]; n.splice(index, 0, { id: uid(), ...item }); return n; }),
    remove: (id) => setItems((p) => p.filter((x) => x.id !== id)),
    update: (id, patch) => setItems((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    moveToFront: (id) => setItems((p) => [p.find((x) => x.id === id), ...p.filter((x) => x.id !== id)].filter(Boolean)),
    reset: () => { try { localStorage.removeItem(KEY); } catch (e) {} setItems(defaults); },
  }), [KEY, defaults]);
  return [items, api];
}

// Strip formatting from pasted clipboard content: insert plain text so it
// adopts the target field's preset styling (font, size, colour) instead of
// carrying the source document's inline styles. Shared by every Editable.
function pastePlainText(e) {
  e.preventDefault();
  const text = (((e.clipboardData || window.clipboardData)
    && (e.clipboardData || window.clipboardData).getData('text/plain')) || '')
    .replace(/\r\n?/g, '\n');
  document.execCommand('insertText', false, text);
}

// Inline contentEditable bound to a value; commits HTML on blur. DOM-managed
// via ref so React never fights the caret. Use for collection item fields.
function Editable({ value, onCommit, tag = 'div', placeholder, className = '', style }) {
  const edit = React.useContext(window.PageEditCtx || React.createContext(true));
  const ref = React.useRef(null);
  const Tag = tag;
  React.useEffect(() => {
    const el = ref.current; if (!el || document.activeElement === el) return;
    const v = value == null ? '' : String(value);
    if (el.innerHTML !== v) el.innerHTML = v;
  }, [value, edit]);
  if (!edit) {
    return <Tag ref={ref} className={className} style={{ outline: 'none', ...style }} />;
  }
  return (
    <Tag ref={ref}
      className={`cs-editable is-editing ${className}`}
      contentEditable suppressContentEditableWarning spellCheck={false}
      data-placeholder={placeholder || ''}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onPaste={pastePlainText}
      onBlur={(e) => onCommit(e.currentTarget.innerHTML)}
      style={{ outline: 'none', ...style }} />);
}

// Standalone persisted editable text (not part of a collection). Persists to
// localStorage under the exact storeKey provided.
function SiteText({ storeKey, defaultHtml = '', tag = 'div', placeholder, className = '', style, inLink = false }) {
  const edit = React.useContext(window.PageEditCtx || React.createContext(true));
  const ref = React.useRef(null);
  const Tag = tag;
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const raw = localStorage.getItem(storeKey);
    let val = raw != null ? raw : defaultHtml;
    // strip accidental wrapping quote pairs (straight or curly)
    const stripped = val.replace(/^[\u201c\u201d"']([\s\S]*?)[\u201c\u201d"']$/, '$1').trim();
    if (stripped !== val) { val = stripped; localStorage.setItem(storeKey, val); }
    el.innerHTML = val;
  }, [storeKey, edit]);
  if (!edit) {
    return <Tag ref={ref} className={className} style={{ outline: 'none', ...style }} />;
  }
  return (
    <Tag ref={ref}
      className={`cs-editable is-editing ${className}`}
      contentEditable suppressContentEditableWarning spellCheck={false}
      data-placeholder={placeholder || ''}
      onMouseDown={inLink ? (e) => e.stopPropagation() : undefined}
      onClick={inLink ? (e) => e.preventDefault() : undefined}
      onPaste={pastePlainText}
      onBlur={(e) => localStorage.setItem(storeKey, e.currentTarget.innerHTML)}
      style={{ outline: 'none', ...style }} />);
}

// On-theme "+ Add" affordance (dashed pill). Use under any editable collection.
function AddButton({ onClick, label = 'Add', style }) {
  const edit = React.useContext(window.PageEditCtx || React.createContext(true));
  if (!edit) return null;
  return (
    <button onClick={onClick} className="add-chip" style={style}>
      <span style={{ fontSize: 15, lineHeight: 1, marginTop: -1 }}>+</span> {label}
    </button>);
}

// ──── ROOT ────────────────────────────────────────────────────────────────
function Landing() {
  const [edit, setEdit] = React.useState(() => {
    if (!window.siteCanEdit()) return false;
    const v = localStorage.getItem('landing:edit');
    return v === null ? true : v === '1';
  });
  React.useEffect(() => {
    localStorage.setItem('landing:edit', edit ? '1' : '0');
    document.body.classList.toggle('cs-editing', edit);
  }, [edit]);

  // Auto-save whenever edit state changes (sidecar)
  React.useEffect(() => {
    if (window.csSidecarAutoSave) window.csSidecarAutoSave('landing', 2500, ['land:', 'col:', 'rm:', 'pa:']);
  }, [edit]);

  // Scroll to hash anchor after React mounts (handles index.html#work links from case study pages)
  React.useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const tryScroll = (attempts = 0) => {
      const el = document.querySelector(hash);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      if (attempts < 10) setTimeout(() => tryScroll(attempts + 1), 120);
    };
    tryScroll();
  }, []);

  return (
    <window.PageEditCtx.Provider value={edit}>
      <div style={{ maxWidth: 1280, width: '100%', position: 'relative', background: C.bg, margin: '0 auto', minHeight: '100vh' }}>
        <CustomCursor />
        <SiteNav active="home" />
        {window.siteCanEdit() &&
        <PageEditToolbar edit={edit} setEdit={setEdit} pageKey="landing"
          extraPrefixes={['land:', 'col:', 'rm:', 'pa:']} />
        }
        <Hero />
        <FeaturedWorkStack />
        <Footer />
      </div>
    </window.PageEditCtx.Provider>
  );
}

// ──── CUSTOM CURSOR ───────────────────────────────────────────────────────
function CustomCursor({ defaultStar = false } = {}) {
  const [isTouchDevice] = React.useState(() => window.matchMedia('(hover: none)').matches);
  const [pos, setPos] = React.useState({ x: -100, y: -100 });
  const [label, setLabel] = React.useState(null);
  const [visible, setVisible] = React.useState(false);
  // On pages without labelled sections, show the star as the resting state.
  const showStar = label != null || defaultStar;

  React.useEffect(() => {
    if (isTouchDevice) return;
    const styleEl = document.createElement('style');
    styleEl.textContent = `body, body * { cursor: none !important; }`;
    document.head.appendChild(styleEl);

    const onMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const section = el && el.closest('[data-cursor-label]');
      setLabel(section ? section.getAttribute('data-cursor-label') : null);
    };
    const onLeave = () => setVisible(false);

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.head.removeChild(styleEl);
    };
  }, [isTouchDevice]);

  if (isTouchDevice) return null;
  return (
    <div style={{
      position: 'fixed', left: 0, top: 0,
      transform: `translate(${pos.x}px, ${pos.y}px)`,
      pointerEvents: 'none', zIndex: 9999,
      opacity: visible ? 1 : 0, transition: 'opacity .2s'
    }}>
      {/* Default dot — hidden when in a labelled section */}
      <div style={{
        position: 'absolute', width: 12, height: 12,
        background: C.pink,
        borderRadius: '50%',
        transform: `translate(-50%, -50%) scale(${showStar ? 0 : 1})`,
        boxShadow: '0 2px 8px rgba(230,51,107,0.4)',
        transition: 'transform .25s cubic-bezier(.34, 1.56, .64, 1)'
      }} />

      {/* Star — appears in labelled sections (e.g. Featured Work) */}
      <svg width="28" height="28" viewBox="0 0 100 100" style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) rotate(${showStar ? 0 : -90}deg) scale(${showStar ? 1 : 0})`,
        filter: 'drop-shadow(0 2px 5px rgba(46,37,34,0.15))',
        transition: 'transform .35s cubic-bezier(.34, 1.56, .64, 1)'
      }}>
        {/* Rounded-edge 5-point star — light pink */}
        <path d="
          M 50 8
          C 53 8 55 11 56 14
          L 60 32
          C 61 35 63 37 66 38
          L 84 40
          C 88 41 91 44 91 48
          C 91 51 89 53 86 55
          L 72 66
          C 69 68 68 71 69 74
          L 73 91
          C 74 95 71 98 67 98
          C 65 98 63 97 61 96
          L 53 87
          C 51 85 49 85 47 87
          L 39 96
          C 37 97 35 98 33 98
          C 29 98 26 95 27 91
          L 31 74
          C 32 71 31 68 28 66
          L 14 55
          C 11 53 9 51 9 48
          C 9 44 12 41 16 40
          L 34 38
          C 37 37 39 35 40 32
          L 44 14
          C 45 11 47 8 50 8 Z
        "



























        fill="#FFD9E1"
        stroke="#F4A6B8" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    </div>);

}

// ──── BRAND WORDMARK (logo · concept 07 — stacked "pri / jain" + star) ─────
function PriWordmark({ size = 22, star = true }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', textAlign: 'center', lineHeight: 0.82, userSelect: 'none' }}>
      {star &&
      <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 100 100"
      style={{ position: 'absolute', top: -size * 0.42, right: -size * 0.5, transform: 'rotate(10deg)' }}>
          <path d="M 50 8 C 53 8 55 11 56 14 L 60 32 C 61 35 63 37 66 38 L 84 40 C 88 41 91 44 91 48 C 91 51 89 53 86 55 L 72 66 C 69 68 68 71 69 74 L 73 91 C 74 95 71 98 67 98 C 65 98 63 97 61 96 L 53 87 C 51 85 49 85 47 87 L 39 96 C 37 97 35 98 33 98 C 29 98 26 95 27 91 L 31 74 C 32 71 31 68 28 66 L 14 55 C 11 53 9 51 9 48 C 9 44 12 41 16 40 L 34 38 C 37 37 39 35 40 32 L 44 14 C 45 11 47 8 50 8 Z"
        fill="#FFD9E1" stroke="#F4A6B8" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      }
      <div style={{
        fontFamily: 'var(--font-headline)',
        fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
        fontSize: size, color: C.orange, letterSpacing: '-0.01em'
      }}>pri</div>
      <div style={{
        fontFamily: 'var(--font-headline)',
        fontVariationSettings: '"opsz" 144, "SOFT" 0, "wght" 300',
        fontSize: size, color: C.pink
      }}>jain</div>
    </div>);

}

// ──── SITE NAV (centered, logo placeholder in the middle) ────────────────
function SiteNav({ active = 'home' }) {
  const [activeId, setActiveId] = React.useState(active);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isMob = useIsMobile();
  const onHome = active === 'home';
  const left = [
    { id: 'work', label: 'Featured Work', href: onHome ? '#work' : 'index.html#work' },
    { id: 'fun', label: 'Personal Art', href: 'personal-art.html' }];
  const right = [
    { id: 'about', label: 'About Me', href: 'about.html' },
    { id: 'resume', label: 'Resume', href: 'resume.html' }];
  const allLinks = [...left, ...right];

  React.useEffect(() => {
    if (!menuOpen) return;
    const fn = (e) => { if (!e.target.closest('[data-mob-nav]')) setMenuOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [menuOpen]);

  const NavLink = ({ it }) => {
    const isActive = activeId === it.id;
    return (
      <a href={it.href}
        target={it.blank ? '_blank' : undefined}
        rel={it.blank ? 'noopener noreferrer' : undefined}
        onClick={() => { setActiveId(it.id); setMenuOpen(false); }}
        className="nav-link"
        style={{
          fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
          color: C.ink, textDecoration: 'none', padding: '10px 14px',
          letterSpacing: '0.03em', transition: 'color .2s',
          position: 'relative', display: 'inline-block'
        }}>
        {isActive && <SketchCircle />}
        <span style={{ position: 'relative', zIndex: 1 }}>{it.label}</span>
      </a>);
  };

  if (isMob) {
    return (
      <div data-mob-nav="" style={{ position: 'sticky', top: 0, zIndex: 100, background: C.bg }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: `1px solid ${C.border}`
        }}>
          <a href="index.html" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            <PriWordmark size={20} />
          </a>
          <button onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 40, height: 40, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: C.ink, fontSize: 22, borderRadius: 8
            }}>
            {menuOpen ? '\u2715' : '\u2630'}
          </button>
        </div>
        {menuOpen && (
          <div style={{ background: C.bg, boxShadow: '0 8px 24px rgba(46,37,34,0.10)' }}>
            {allLinks.map((it) => (
              <a key={it.id} href={it.href}
                target={it.blank ? '_blank' : undefined}
                rel={it.blank ? 'noopener noreferrer' : undefined}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block', padding: '16px 24px',
                  fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600,
                  color: C.ink, textDecoration: 'none', letterSpacing: '0.01em',
                  borderBottom: `1px solid ${C.border}`
                }}>
                {it.label}
              </a>
            ))}
          </div>
        )}
        <style>{`.nav-link:hover { color: ${C.ink} !important; }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      padding: '28px 60px 18px',
      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28,
      background: `linear-gradient(to bottom, ${C.bg} 70%, rgba(250,243,232,0))`
    }}>
      {left.map((it) => <NavLink key={it.id} it={it} />)}
      <a href="index.html"
        onClick={onHome ? (e) => {e.preventDefault();window.scrollTo({ top: 0, behavior: 'smooth' });} : undefined}
        style={{ position: 'relative', margin: '0 18px', textDecoration: 'none', display: 'inline-flex' }}
        aria-label="Home — back to landing page">
        <div style={{
          display: 'inline-flex', padding: '6px 8px',
          transition: 'transform .25s cubic-bezier(.5,1.4,.35,1)', cursor: 'pointer'
        }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(-5deg) scale(1.08)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0) scale(1)'}>
          <PriWordmark size={23} />
        </div>
      </a>
      {right.map((it) => <NavLink key={it.id} it={it} />)}
      <style>{`
        .nav-link:hover { color: ${C.ink} !important; }
      `}</style>
    </div>);
}

// Sketched / hand-drawn looking circle highlight that animates like it's being drawn
function SketchCircle() {
  const stroke = '#F4A6B8'; // light pink
  return (
    <svg viewBox="0 0 200 80" preserveAspectRatio="none" style={{
      position: 'absolute', left: -8, right: -8, top: -4, bottom: -4,
      width: 'calc(100% + 16px)', height: 'calc(100% + 8px)',
      pointerEvents: 'none', zIndex: 0
    }}>
      {/* First sketchy pass — drawn first */}
      <path d="
        M 16 40
        C 16 18, 60 8, 100 8
        C 142 8, 184 20, 184 40
        C 184 60, 142 72, 100 72
        C 58 72, 16 62, 16 40 Z
      "






      fill="none" stroke={stroke} strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      pathLength="100"
      style={{
        strokeDasharray: 100,
        strokeDashoffset: 100,
        animation: 'sketchDraw .65s cubic-bezier(.55, .1, .35, 1) forwards'
      }} />
      {/* Second pass — drawn after, slightly offset for "drawn twice" effect */}
      <path d="
        M 22 42
        C 24 22, 64 12, 102 11
        C 140 10, 180 22, 180 42
        C 180 60, 144 68, 100 70
        C 60 71, 22 62, 22 42
      "






      fill="none" stroke={stroke} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" opacity="0.55"
      pathLength="100"
      style={{
        strokeDasharray: 100,
        strokeDashoffset: 100,
        animation: 'sketchDraw .55s .45s cubic-bezier(.55, .1, .35, 1) forwards'
      }} />
    </svg>);

}

// ──── HERO ────────────────────────────────────────────────────────────────
function Hero() {
  const { removed, remove, restoreAll, count } = useRemovable('hero-photos');
  const isMob = useIsMobile();
  return (
    <section style={{
      position: 'relative', minHeight: isMob ? 'auto' : 880,
      padding: isMob ? '40px 24px 60px' : '40px 0 80px'
    }}>
      {/* Upper-left: arched portrait — desktop only */}
      {!isMob && !removed.has('hp1') &&
      <div style={{
        position: 'absolute', left: 90, top: 320,
        animation: 'popInScatter .9s 0.55s cubic-bezier(.34, 1.56, .64, 1) both'
      }}>
          <div className="cs-removable" style={{ transform: 'rotate(-6deg)', position: 'relative', display: 'inline-block' }}>
            <DeleteDot onDelete={() => remove('hp1')} label="photo" style={{ top: 4, right: 6 }} />
            <ArchPhoto />
          </div>
        </div>
      }

      {/* Upper-right: tilted photo — desktop only */}
      {!isMob && !removed.has('hp2') &&
      <div style={{
        position: 'absolute', right: 100, top: 60,
        animation: 'popInScatter .9s 0.75s cubic-bezier(.34, 1.56, .64, 1) both'
      }}>
          <div className="cs-removable" style={{ transform: 'rotate(8deg)', position: 'relative', display: 'inline-block' }}>
            <DeleteDot onDelete={() => remove('hp2')} label="photo" />
            <TiltPhoto w={280} h={340} placeholderId="hero-photo-2" tape={C.pink} />
          </div>
        </div>
      }

      {/* Lower-right: accent photo — desktop only */}
      {!isMob && !removed.has('hp3') &&
      <div style={{
        position: 'absolute', right: 180, bottom: 60,
        animation: 'popInScatter .9s 0.95s cubic-bezier(.34, 1.56, .64, 1) both'
      }}>
          <div className="cs-removable" style={{ transform: 'rotate(-4deg)', position: 'relative', display: 'inline-block' }}>
            <DeleteDot onDelete={() => remove('hp3')} label="photo" />
            <TiltPhoto w={200} h={240} placeholderId="hero-photo-3" tape={C.lavender} />
          </div>
        </div>
      }

      {/* CENTERED text block */}
      <div style={{
        position: 'relative', zIndex: 5,
        textAlign: 'center', paddingTop: isMob ? 20 : 210,
        maxWidth: isMob ? '100%' : 560, margin: '0 auto'
      }}>
        {/* "Heyy, I'm Pri!" — script, animated */}
        <HeyTitle />

        {/* Big Bugaki-style serif headline — three lines so it fits between photos */}
        <div style={{
          marginTop: 50,
          animation: 'fadeSlideUp 1s 1.7s cubic-bezier(.2,.7,.3,1) both'
        }}>
          <SiteText tag="h1" storeKey="land:hero-headline" className="type-headline"
            defaultHtml="Graphic &amp;<br />Experience<br />Designer"
            style={{ margin: 0, fontSize: 'clamp(52px, 13vw, 84px)' }} />
        </div>

        {/* Scroll hint */}
        <div style={{
          marginTop: 70,
          animation: 'fadeIn 1s 2.3s ease-out both'
        }}>
          <SiteText storeKey="land:scroll-hint" className="type-eyebrow" defaultHtml="scroll for the work" style={{ marginBottom: 6 }} />
          <div style={{ fontSize: 24, color: C.pink, animation: 'bounceDown 1.6s 2.6s ease-in-out infinite' }}>↓</div>
        </div>

        {count > 0 &&
        <div style={{ marginTop: 18 }}>
            <RestoreChip count={count} onRestore={restoreAll} />
          </div>
        }
      </div>
    </section>);

}

// "Heyy, I'm Pri!" — centered, tilted, animates in
function HeyTitle() {
  const isMob = useIsMobile();
  return (
    <div style={{ height: 60, position: 'relative', textAlign: 'center' }}>
      <SiteText storeKey="land:hey" className="type-script" defaultHtml="Heyy, I'm Pri!" style={{
        display: 'inline-block',
        fontSize: isMob ? 42 : 56, fontWeight: 700,
        color: C.pink, letterSpacing: '0.01em',
        transform: 'rotate(-3deg)',
        animation: 'fadeSlideUp .8s .25s cubic-bezier(.2,.7,.3,1) both'
      }} />
    </div>);

}

// Arched photo placeholder w/ peach frame + hand-drawn orange outline + doodles
function ArchPhoto() {
  const w = 230,h = 280;
  return (
    <div style={{ position: 'relative', width: w + 40, height: h + 30 }}>
      {/* Hand-drawn squiggle over top */}
      <svg viewBox="0 0 100 30" width="78" height="24" style={{
        position: 'absolute', top: -8, left: w * 0.55
      }}>
        <path d="M 6 18 q 4 -10 10 -10 q 6 0 6 10 q 0 -10 8 -10 q 8 0 6 12 q 6 -12 14 -12 q 8 0 6 12 q 6 -10 14 -8 q 8 4 4 12"
        fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
        <path d="M 86 4 l 4 4 M 86 8 l 4 -4" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* Hearts on the left */}
      <svg viewBox="0 0 40 40" width="36" height="36" style={{
        position: 'absolute', left: -10, top: 50
      }}>
        <path d="M 20 34 C 20 34 6 24 6 14 C 6 8 12 6 16 8 C 18 10 20 12 20 14 C 20 12 22 10 24 8 C 28 6 34 8 34 14 C 34 24 20 34 20 34 Z"
        fill="none" stroke={C.pink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg viewBox="0 0 40 40" width="22" height="22" style={{
        position: 'absolute', left: 12, top: 90
      }}>
        <path d="M 20 34 C 20 34 6 24 6 14 C 6 8 12 6 16 8 C 18 10 20 12 20 14 C 20 12 22 10 24 8 C 28 6 34 8 34 14 C 34 24 20 34 20 34 Z"
        fill={C.pink} stroke={C.pink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Star bottom-right */}
      <svg viewBox="0 0 40 40" width="28" height="28" style={{
        position: 'absolute', right: 0, bottom: 50
      }}>
        <path d="M 20 4 L 24 14 L 35 14 L 26 22 L 30 33 L 20 26 L 10 33 L 14 22 L 5 14 L 16 14 Z"
        fill={C.orange} stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>

      {/* The arched photo */}
      <div style={{
        position: 'absolute', left: 14, top: 14,
        width: w, height: h
      }}>
        {/* Peach-pink solid arch behind the (background-removed) photo */}
        <div style={{
          position: 'absolute', inset: 0,
          background: C.softPink,
          borderRadius: `${w / 2}px ${w / 2}px 14px 14px`
        }} />
        {/* Image slot self-clips to the arch via clip-path so its
             Replace / Remove controls escape (no overflow:hidden parent) */}
        <image-slot id="hero-photo-1" placeholder="your photo"
        fit="contain"
        mask={`inset(0 round ${w / 2}px ${w / 2}px 14px 14px)`}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }} />
        
        {/* Hand-drawn orange outline */}
        <svg viewBox={`0 0 ${w + 20} ${h + 20}`} width={w + 20} height={h + 20} style={{
          position: 'absolute', left: -10, top: -10, pointerEvents: 'none'
        }}>
          <path d={`
            M 14 ${h + 4}
            L 14 ${w / 2 + 14}
            Q 14 8 ${w / 2 + 10} 8
            Q ${w + 6} 8 ${w + 6} ${w / 2 + 14}
            L ${w + 6} ${h + 4}
            Z
          `}
          fill="none" stroke={C.orange} strokeWidth="6"
          strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>);

}

// Tilted scrapbook-style photo
function TiltPhoto({ w, h, placeholderId, tape = '#E6336B' }) {
  return (
    <div style={{
      width: w, height: h, padding: 12,
      background: '#fff',
      boxShadow: '0 18px 36px rgba(46,37,34,0.15), 0 4px 8px rgba(46,37,34,0.06)',
      position: 'relative',
      borderRadius: 4
    }}>
      {/* tape strip */}
      <div style={{
        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%) rotate(-4deg)',
        width: 90, height: 22, background: tape, opacity: 0.8
      }} />
      <div style={{
        width: '100%', height: '100%', background: C.peach,
        borderRadius: 2
      }}>
        <image-slot id={placeholderId} placeholder="drop photo" radius="2"
        style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div>);

}

// ──── FEATURED WORK STACK ─────────────────────────────────────────────────
function FeaturedWorkStack() {
  const isMob = useIsMobile();
  // 4 project slots — editable placeholders so the user can fill in real work.
  const cards = [
  { id: 'card-1', num: '01', tag: 'Training · Integration', title: 'Globus Medical &amp; Nevro', sub: 'A Company Integration', desc: 'Developed training experiences and resources to support the integration of Nevro&rsquo;s Salesforce platform with Globus Medical&rsquo;s AtlasOne system, simplifying new workflows and helping employees quickly adapt to the unified platform.', stat: '300+', impact: 'Employees supported through the transition', locked: 'Due to proprietary company information, this project is available upon request.', img: 'https://framerusercontent.com/images/RIqd44K6tpkqd5qONtzrHAu1A.png', href: 'atlasone.html' },
  { id: 'card-2', num: '02', tag: 'UX · Onboarding', title: 'Halloween Academy', sub: 'Onboarding Experience 2024', desc: 'A vibrant onboarding experience that energizes temporary and full-time employees through festive, engaging training, celebrating the spirit of Halloween at Party City.', stat: '40%', impact: 'Increase in sales and customer engagement', img: 'https://framerusercontent.com/images/jRIBcsh8tweLS8GpXnn8XcZ7WcM.png', href: 'halloween-academy.html' },
  { id: 'card-3', num: '03', tag: 'UX · Onboarding', title: 'Party City Road Trip', sub: 'Onboarding Experience 2024', desc: 'A unified and engaging onboarding journey with 11 interactive stops, delivering tools, resources, and cultural insights. This experience builds confidence, fosters belonging, and equips new team members for success.', stat: '100%', impact: 'Team collaboration across the journey', img: 'https://framerusercontent.com/images/vrjWY0l7WUXJfscg8TO6xljhkWQ.jpg', href: 'case-study-template.html' },
  { id: 'card-4', num: '03', tag: 'Concept · AI', title: 'Tempo', sub: 'Future of Fine Dining with AI', desc: 'An advanced restaurant system with AI-powered ordering, payments, and task management, boosting efficiency at high-end restaurants.', stat: '100%', impact: 'Team collaboration', img: 'https://framerusercontent.com/images/OeI9DWGwt7BHpwgt7s0BcP8JlE.png', href: 'Tempo.html' }];


  const [order] = React.useState(cards.map((c) => c.id));
  const { removed, remove, restoreAll, count } = useRemovable('work-cards');
  const byId = Object.fromEntries(cards.map((c) => [c.id, c]));
  const liveOrder = order.filter((id) => !removed.has(id));
  const N = liveOrder.length;

  const CARD_W = 980;
  const CARD_H = 380;
  const SPREAD_GAP = 50;

  // Scroll-driven horizontal parallax — cards drift gently side-to-side
  const sectionRef = React.useRef(null);
  const [scrollProg, setScrollProg] = React.useState(0);
  React.useEffect(() => {
    if (isMob) return;
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const prog = 1 - (rect.bottom / (vh + rect.height));
      setScrollProg(Math.max(-0.5, Math.min(1.5, prog)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMob]);

  const X_SHIFTS = [42, -56, 36, -48]; // px travel per card (alternating)

  return (
    <section id="work" ref={sectionRef} data-cursor-label="Featured Work" style={{
      position: 'relative', padding: isMob ? '40px 0 60px' : '60px 0 100px',
      borderTop: `1px solid ${C.border}`,
      marginTop: 40
    }}>
      <div style={{ textAlign: 'center', marginBottom: 24, padding: isMob ? '0 20px' : 0 }}>
        <h2 className="type-headline-md" style={{ margin: 0, fontSize: isMob ? 'clamp(32px, 10vw, 52px)' : undefined }}>Featured Work</h2>
        <RestoreChip count={count} onRestore={restoreAll} style={{ marginTop: 14 }} />
      </div>

      {isMob ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 16px' }}>
          {N === 0 && <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--font-script)', fontSize: 24, color: C.inkSoft }}>No projects here yet.</div>}
          {liveOrder.map((id) => {
            const c = byId[id];
            return (
              <div key={c.id} className="cs-removable" style={{
                position: 'relative', background: C.peach,
                border: `1.5px solid ${C.border}`, borderRadius: 16,
                overflow: 'hidden', boxShadow: '0 8px 24px rgba(46,37,34,0.08)'
              }}>
                <DeleteDot onDelete={() => remove(c.id)} label="project" style={{ top: 12, right: 12, zIndex: 20 }} />
                <div style={{ height: 200, background: '#fff' }}>
                  <image-slot id={`${c.id}-img`} placeholder="project image"
                    {...c.img ? { src: c.img } : {}}
                    style={{ width: '100%', height: '100%', display: 'block' }} />
                </div>
                <div style={{ padding: '18px 20px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                    fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.16em', textTransform: 'uppercase', color: C.pink }}>
                    <span style={{ color: C.inkMuted }}>{c.num}</span>
                    <span style={{ flex: '0 0 auto', width: 14, height: 1, background: C.inkMuted, opacity: 0.5 }} />
                    <span dangerouslySetInnerHTML={{ __html: c.tag }} />
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-headline)',
                    fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 700',
                    fontSize: 24, lineHeight: 1.05, color: C.orange }}
                    dangerouslySetInnerHTML={{ __html: c.title }} />
                  <div style={{ fontFamily: 'var(--font-script)', fontSize: 17, color: C.pink, marginBottom: 10 }}
                    dangerouslySetInnerHTML={{ __html: c.sub }} />
                  <p style={{ margin: '0 0 14px', fontFamily: 'var(--font-ui)', fontSize: 14, lineHeight: 1.6, color: C.inkSoft }}
                    dangerouslySetInnerHTML={{ __html: c.desc }} />
                  <a href={c.href} className="btn btn-primary btn-sm">
                    View Case Study <span className="btn-arrow">→</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          position: 'relative', width: CARD_W, margin: '32px auto 0',
          height: N === 0 ? 160 : N * (CARD_H + SPREAD_GAP) + 40,
        }}>
          {N === 0 &&
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-script)', fontSize: 26, color: C.inkSoft }}>No projects here yet.</div>
            <RestoreChip count={count} onRestore={restoreAll} />
          </div>}
          {liveOrder.map((id, idx) => {
            const c = byId[id];
            const xShift = (X_SHIFTS[idx % 4] || 40) * scrollProg;
            return (
              <WavyCard key={c.id} c={c}
                w={CARD_W} h={CARD_H}
                top={idx * (CARD_H + SPREAD_GAP)}
                z={N - idx}
                isTop={true}
                spread={true}
                xShift={xShift}
                onDelete={() => remove(c.id)}
                tilt={[-1, 1.2, -0.8, 1][idx % 4]} />);
          })}
        </div>
      )}
    </section>);
}

// Small playful "spread / stack" toggle
function SpreadButton({ spread, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick}
    onMouseEnter={() => setHover(true)}
    onMouseLeave={() => setHover(false)}
    style={{
      position: 'relative',
      background: 'transparent', border: 'none',
      padding: '6px 18px',
      fontFamily: 'var(--font-script)', fontSize: 22, fontWeight: 700,
      color: C.pink,
      cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 8,
      transform: `rotate(${hover ? 0 : -2}deg) translateY(${hover ? -2 : 0}px)`,
      transition: 'transform .25s cubic-bezier(.5,1.4,.35,1)'
    }}>
      {/* Sketched circle around the button */}
      <svg viewBox="0 0 220 60" preserveAspectRatio="none" style={{
        position: 'absolute', inset: -2, width: 'calc(100% + 4px)', height: 'calc(100% + 4px)',
        pointerEvents: 'none'
      }}>
        <path d="
          M 12 30
          C 12 12, 60 6, 110 6
          C 160 6, 208 16, 208 30
          C 208 46, 158 54, 110 54
          C 62 54, 12 46, 12 30 Z
        "






        fill="none" stroke={C.pink} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: 16 }}>{spread ? '⤴' : '⤵'}</span>
      <span>{spread ? 'stack them back' : 'spread them out'}</span>
    </button>);

}

// Generate a wavy-edged rectangle path (clockwise)
function wavyRectPath(w, h, amp = 9, waveLen = 70) {
  const topCount = Math.max(4, Math.round((w - 2 * amp) / waveLen));
  const sideCount = Math.max(3, Math.round((h - 2 * amp) / waveLen));
  const topStep = (w - 2 * amp) / topCount;
  const sideStep = (h - 2 * amp) / sideCount;
  const out = amp * 2.2; // how far the wave bulges out

  let path = `M ${amp} ${amp}`;
  // Top edge L→R, bulges up
  for (let i = 0; i < topCount; i++) {
    const cx = amp + i * topStep + topStep / 2;
    const cy = amp - out;
    const ex = amp + (i + 1) * topStep;
    const ey = amp;
    path += ` Q ${cx} ${cy}, ${ex} ${ey}`;
  }
  // Right edge T→B, bulges right
  for (let i = 0; i < sideCount; i++) {
    const cx = w - amp + out;
    const cy = amp + i * sideStep + sideStep / 2;
    const ex = w - amp;
    const ey = amp + (i + 1) * sideStep;
    path += ` Q ${cx} ${cy}, ${ex} ${ey}`;
  }
  // Bottom edge R→L, bulges down
  for (let i = 0; i < topCount; i++) {
    const cx = w - amp - i * topStep - topStep / 2;
    const cy = h - amp + out;
    const ex = w - amp - (i + 1) * topStep;
    const ey = h - amp;
    path += ` Q ${cx} ${cy}, ${ex} ${ey}`;
  }
  // Left edge B→T, bulges left
  for (let i = 0; i < sideCount; i++) {
    const cx = amp - out;
    const cy = h - amp - i * sideStep - sideStep / 2;
    const ex = amp;
    const ey = h - amp - (i + 1) * sideStep;
    path += ` Q ${cx} ${cy}, ${ex} ${ey}`;
  }
  return path + ' Z';
}

// Wavy card with 1/3 image + 2/3 text · cream interior, professional hierarchy,
// View Case Study CTA bottom-right.
function WavyCard({ c, w, h, top, z, isTop, spread, xShift = 0, onClick, onDelete, tilt = 0 }) {
  const [hover, setHover] = React.useState(false);
  const lift = 0;
  // 4 gentle squiggle points per long edge — present but professional.
  const path = React.useMemo(() => wavyRectPath(w, h, 4, 240), [w, h]);

  // Stop card-onClick (which brings-to-top) firing when clicking text fields or CTA.
  const stop = (e) => e.stopPropagation();

  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="cs-removable"
      style={{
        position: 'absolute', left: 0, top, zIndex: z,
        width: w, height: h,
        transform: `rotate(${tilt}deg) translateX(${xShift}px)`,
        transition: 'transform .08s linear',
        cursor: 'default',
        filter: hover ?
        'drop-shadow(0 30px 28px rgba(46,37,34,0.14)) drop-shadow(0 4px 8px rgba(46,37,34,0.06))' :
        'drop-shadow(0 16px 22px rgba(46,37,34,0.10)) drop-shadow(0 3px 6px rgba(46,37,34,0.05))'
      }}>
      {/* Delete this project — reveals on card hover; stack re-flows on remove */}
      {onDelete &&
      <DeleteDot onDelete={onDelete} label="project"
      style={{ top: 20, right: 26, zIndex: 30 }} />
      }

      {/* Wavy background SVG */}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', inset: 0, display: 'block', overflow: 'visible' }}>
        <path d={path}
        fill={C.peach}
        stroke={C.pink}
        strokeWidth="1.5"
        strokeLinejoin="round" />
      </svg>

      {/* Content — 42% image · text */}
      <div style={{
        position: 'absolute', inset: 32,
        display: 'flex', gap: 28, alignItems: 'stretch'
      }}>
        {/* Image — clean rounded slot, no dashed border */}
        <image-slot id={`${c.id}-img`} placeholder="project image"
        radius="14"
        {...c.img ? { src: c.img } : {}}
        style={{
          flex: '0 0 calc(42% - 14px)',
          height: '100%',
          display: 'block',
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 1px 0 rgba(46,37,34,0.06), inset 0 0 0 1px rgba(46,37,34,0.06)'
        }} />

        {/* Text + CTA column — 2/3 */}
        <div style={{
          flex: '1 1 auto',
          padding: '6px 4px 2px',
          display: 'flex', flexDirection: 'column',
          minWidth: 0
        }}>
          {/* Eyebrow row: number · tag */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: C.pink
          }}>
            <span style={{ color: C.inkMuted }}>{c.num}</span>
            <span style={{ flex: '0 0 auto', width: 18, height: 1, background: C.inkMuted, opacity: 0.5 }} />
            <span contentEditable suppressContentEditableWarning
            data-placeholder="category"
            onClick={stop}
            style={{ outline: 'none' }}
            dangerouslySetInnerHTML={{ __html: c.tag }} />
          </div>

          {/* Title */}
          <h3 contentEditable suppressContentEditableWarning
          data-placeholder="Project title"
          onClick={stop}
          style={{
            margin: '10px 0 6px',
            fontFamily: 'var(--font-headline)',
            fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 700',
            fontSize: 38, lineHeight: 1.05, letterSpacing: '-0.01em',
            color: C.orange, outline: 'none'
          }}
          dangerouslySetInnerHTML={{ __html: c.title }} />

          {/* Sub / tag line */}
          <div contentEditable suppressContentEditableWarning
          data-placeholder="A short sub-title or tag line"
          onClick={stop}
          style={{
            fontFamily: 'var(--font-script)', fontSize: 22, fontWeight: 600,
            color: C.pink, lineHeight: 1.2, outline: 'none'
          }}
          dangerouslySetInnerHTML={{ __html: c.sub }} />

          {/* Description */}
          <div contentEditable suppressContentEditableWarning
          data-placeholder="Project description — start typing here…"
          onClick={stop}
          style={{
            marginTop: 10,
            fontFamily: 'var(--font-ui)', fontWeight: 400,
            fontSize: 15, lineHeight: 1.6, color: C.inkSoft,
            outline: 'none', flex: '0 1 auto',
            maxWidth: '95%'
          }}
          dangerouslySetInnerHTML={{ __html: c.desc }} />

          {/* Impact row — label + separate stat sentence (mirrors site) */}
          {(c.stat || c.impact) &&
          <div style={{ marginTop: 14 }}>
            <div style={{
              fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkMuted
            }}>
              Impact
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
              <span style={{
                fontFamily: 'var(--font-headline)',
                fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 700',
                fontSize: 26, lineHeight: 1, color: C.orange
              }}>{c.stat}</span>
              <span style={{
                fontFamily: 'var(--font-ui)', fontSize: 14, color: C.inkSoft, lineHeight: 1.4
              }}>{c.impact}</span>
            </div>
          </div>
          }

          {/* Locked-project note — small red text */}
          {/* CTA row — bottom-right */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 12 }}>
            <a href={c.href} onClick={stop} className="btn btn-primary btn-sm">
              View Case Study
              <span className="btn-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </article>);

}

// ──── PERSONAL ART (standalone page) ───────────────────────────────────────
// Its own tab — two placeholder cards, each linking to an editorial gallery.

// Lightweight inline-editable text for this page (persists under "pa:").
// inLink: when the field sits inside an <a>, swallow the click so editing
// doesn't trigger navigation.
function PAEditable({ storeKey, defaultHtml = '', tag = 'div', placeholder, style, className = '', inLink = false }) {
  const edit = React.useContext(window.PageEditCtx || React.createContext(true));
  const ref = React.useRef(null);
  const Tag = tag;
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const raw = localStorage.getItem('pa:' + storeKey);
    let val = raw != null ? raw : defaultHtml;
    const stripped = val.replace(/^[\u201c\u201d"']([\s\S]*?)[\u201c\u201d"']$/, '$1').trim();
    if (stripped !== val) { val = stripped; localStorage.setItem('pa:' + storeKey, val); }
    el.innerHTML = val;
  }, [storeKey, edit]);
  if (!edit) {
    return <Tag ref={ref} className={className} style={style} />;
  }
  return (
    <Tag ref={ref}
    className={`cs-editable is-editing ${className}`}
    contentEditable suppressContentEditableWarning spellCheck={false}
    data-placeholder={placeholder || ''}
    onMouseDown={inLink ? (e) => e.stopPropagation() : undefined}
    onClick={inLink ? (e) => e.preventDefault() : undefined}
    onBlur={(e) => localStorage.setItem('pa:' + storeKey, e.currentTarget.innerHTML)}
    style={style} />);

}

function PersonalArtPage() {
  const [edit, setEdit] = React.useState(() => {
    if (!window.siteCanEdit()) return false;
    const v = localStorage.getItem('pa:edit');
    return v === null ? true : v === '1';
  });
  React.useEffect(() => {
    localStorage.setItem('pa:edit', edit ? '1' : '0');
    document.body.classList.toggle('cs-editing', edit);
  }, [edit]);

  const cards = [
  { href: 'playground.html', slot: 'pa-card-1', num: '01', title: 'Fun Personal Designs', tag: '2025–26' },
  { href: 'emoti.html', slot: 'pa-card-2', num: '02', title: 'Personal Branding Project – Emoti Pets', tag: '2025', src: 'assets/emoti-pets.png' }];

  const { removed, remove, restoreAll, count } = useRemovable('pa-cards');
  const live = cards.filter((c) => !removed.has(c.slot));
  return (
    <window.PageEditCtx.Provider value={edit}>
    <div style={{ maxWidth: 1280, width: '100%', position: 'relative', background: C.bg, margin: '0 auto', minHeight: '100vh' }}>
      <SiteNav active="fun" />
      {window.siteCanEdit() &&
      <PageEditToolbar edit={edit} setEdit={setEdit} pageKey="pa"
        extraPrefixes={['pa:', 'rm:pa-']} />
      }

      <section style={{ position: 'relative', padding: 'clamp(24px, 5vw, 40px) clamp(16px, 7vw, 90px) 80px' }}>
        <div style={{ marginBottom: 50, maxWidth: 760 }}>
          <PAEditable storeKey="page-eyebrow" defaultHtml="Personal Art" placeholder="eyebrow"
          className="type-eyebrow" style={{ color: C.pink, marginBottom: 16 }} />
          <PAEditable storeKey="page-title" tag="h1" defaultHtml="Things I make<br>just for me." placeholder="Headline"
          style={{
            margin: '0 0 18px', fontFamily: 'var(--font-headline)',
            fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 700',
            fontSize: 80, lineHeight: 0.96, letterSpacing: '-0.03em', color: C.orange
          }} />
          <PAEditable storeKey="page-intro" tag="p"
          defaultHtml="The side of the practice with no brief and no deadline — zines, lettering, and whatever else is worth making for its own sake."
          placeholder="Intro…"
          style={{
            margin: 0, fontFamily: 'var(--font-ui)', fontSize: 18, lineHeight: 1.65,
            color: C.inkSoft, maxWidth: 560, textWrap: 'pretty'
          }} />
        </div>

        <div className="pa-cards-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${live.length || 1}, minmax(0, 1fr))`, gap: 40 }}>
          {live.map((c) =>
          <Removable key={c.slot} onDelete={() => remove(c.slot)} label="artwork">
              <PersonalArtCard {...c} />
            </Removable>
          )}
          {live.length === 0 &&
          <div style={{
            padding: '60px 0', textAlign: 'center',
            fontFamily: 'var(--font-script)', fontSize: 26, color: C.inkSoft
          }}>
              Nothing here right now.
            </div>
          }
        </div>

        {count > 0 &&
        <div style={{ marginTop: 28 }}>
            <RestoreChip count={count} onRestore={restoreAll} />
          </div>
        }
      </section>

      <Footer />
    </div>
    </window.PageEditCtx.Provider>);

}

function PersonalArtCard({ href, slot, num, title, tag, src }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a href={href}
    onMouseEnter={() => setHover(true)}
    onMouseLeave={() => setHover(false)}
    style={{
      display: 'block', textDecoration: 'none', color: 'inherit',
      background: C.peach, padding: 22,
      border: `1.5px solid ${C.border}`,
      transform: hover ? 'translateY(-6px)' : 'none',
      boxShadow: hover ?
      '0 26px 44px rgba(46,37,34,0.16), 0 6px 12px rgba(46,37,34,0.07)' :
      '0 10px 22px rgba(46,37,34,0.08)',
      transition: 'transform .35s cubic-bezier(.5,1.4,.35,1), box-shadow .3s ease'
    }}>
      {/* Image area */}
      <div style={{
        height: 320, background: '#fff', overflow: 'hidden',
        boxShadow: 'inset 0 0 0 1px rgba(46,37,34,0.06)'
      }}>
        <image-slot id={slot} placeholder="drop artwork" src={src || undefined}
        style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {/* Text row */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        gap: 20, marginTop: 22
      }}>
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
            fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase', color: C.pink
          }}>
            <span style={{ color: C.inkMuted }}>{num}</span>
            <span style={{ width: 18, height: 1, background: C.inkMuted, opacity: 0.5 }} />
            <PAEditable storeKey={slot + '-tag'} tag="span" inLink defaultHtml={tag} placeholder="tag"
            style={{ fontFamily: 'var(--font-script)', fontSize: 20, letterSpacing: 0, textTransform: 'none', color: C.pink }} />
          </div>
          <PAEditable storeKey={slot + '-title'} tag="h3" inLink defaultHtml={title} placeholder="Title"
          style={{
            margin: 0, fontFamily: 'var(--font-headline)',
            fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 700',
            fontSize: 34, lineHeight: 1.02, letterSpacing: '-0.015em', color: C.ink
          }} />
        </div>
        <span style={{
          flex: '0 0 auto',
          fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
          letterSpacing: '0.04em', color: C.ink,
          display: 'inline-flex', alignItems: 'center', gap: 7,
          paddingBottom: 6
        }}>
          View
          <span style={{ display: 'inline-block', transition: 'transform .25s', transform: hover ? 'translateX(4px)' : 'none' }}>→</span>
        </span>
      </div>
    </a>);

}

// ──── FOOTER ──────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      padding: 'clamp(32px, 5vw, 48px) clamp(20px, 6vw, 80px) 28px',
      background: C.burgundy,
      color: '#fff',
      marginTop: 80,
      position: 'relative',
      width: '100vw',
      marginLeft: 'calc(50% - 50vw)',
      boxSizing: 'border-box'
    }}>
      <div style={{
        textAlign: 'center', maxWidth: 720, margin: '0 auto'
      }}>
        {/* Big "Say Hello :)" headline */}
        <SiteText tag="h3" storeKey="land:footer-head" defaultHtml="Say Hello :)" style={{
          margin: 0,
          fontFamily: 'var(--font-headline)',
          fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 800',
          fontSize: 52, lineHeight: 1.0, letterSpacing: '-0.015em',
          color: C.softPink
        }} />

        {/* Email + LinkedIn */}
        <div style={{
          marginTop: 16,
          display: 'flex', justifyContent: 'center', gap: 24, alignItems: 'center',
          fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 500,
          color: '#fff'
        }}>
          <a href="mailto:prij2102@gmail.com" style={{
            color: '#fff', textDecoration: 'none',
            borderBottom: `1px solid rgba(255,203,213,0.4)`,
            paddingBottom: 2,
            transition: 'color .2s, border-color .2s'
          }}
          onMouseEnter={(e) => {e.currentTarget.style.color = C.softPink;e.currentTarget.style.borderBottomColor = C.softPink;}}
          onMouseLeave={(e) => {e.currentTarget.style.color = '#fff';e.currentTarget.style.borderBottomColor = 'rgba(255,203,213,0.4)';}}>
          <SiteText tag="span" inLink storeKey="land:footer-email" defaultHtml="prij2102@gmail.com" />
          </a>
          <span style={{ opacity: 0.4 }}>·</span>
          <a href="https://linkedin.com/in/pri-jain" target="_blank" rel="noreferrer" style={{
            color: '#fff', textDecoration: 'none',
            borderBottom: `1px solid rgba(255,203,213,0.4)`,
            paddingBottom: 2,
            transition: 'color .2s, border-color .2s'
          }}
          onMouseEnter={(e) => {e.currentTarget.style.color = C.softPink;e.currentTarget.style.borderBottomColor = C.softPink;}}
          onMouseLeave={(e) => {e.currentTarget.style.color = '#fff';e.currentTarget.style.borderBottomColor = 'rgba(255,203,213,0.4)';}}>
            <SiteText tag="span" inLink storeKey="land:footer-linkedin" defaultHtml="linkedin.com/in/pri-jain" />
          </a>
        </div>

        {/* Sign-off */}
        <SiteText storeKey="land:footer-signoff" defaultHtml="Let&rsquo;s connect and make things happen together." style={{
          marginTop: 32,
          paddingTop: 18,
          borderTop: `1px solid rgba(255,255,255,0.15)`,
          fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500,
          letterSpacing: '0.04em',
          color: 'rgba(255,255,255,0.65)'
        }} />
      </div>
    </footer>);

}

Object.assign(window, { Landing, SiteNav, Footer, C, CustomCursor, PersonalArtPage, PersonalArtCard, useRemovable, DeleteDot, Removable, RestoreChip, PriWordmark, useCollection, Editable, SiteText, AddButton, uid });