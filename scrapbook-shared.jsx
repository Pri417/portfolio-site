// scrapbook-shared.jsx — shared visual atoms for all three directions.
// Tape, Polaroid, Sticker, TornPaper, PaperClip, GraphPaper, doodles, palette.
// All exported to window so direction files can use them.

const PJ = {
  cream:   '#f6efe0',
  cream2:  '#efe5cf',
  paper:   '#fbf7ec',
  ink:     '#1a1814',
  inkSoft: '#3a342a',
  pink:    '#ff3b8b',
  pinkHot: '#ff1f7a',
  pinkSoft:'#ffb3d1',
  yellow:  '#ffcf33',
  yellow2: '#ffe066',
  cyan:    '#3ec7c2',
  cyan2:   '#9be0dd',
  coral:   '#ff6b4a',
  mint:    '#a8e6cf',
  lilac:   '#c8a8ff',
  cork:    '#c9a777',
};

// ───── GraphPaper background ───────────────────────────────────────────────
function GraphPaper({ color = '#cfe4ee', size = 28, opacity = 0.55, bg = PJ.paper, children, style }) {
  const c = `rgba(94,150,170,${opacity * 0.35})`;
  const c2 = `rgba(94,150,170,${opacity * 0.7})`;
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: bg,
      backgroundImage:
        `linear-gradient(${c} 1px, transparent 1px),` +
        `linear-gradient(90deg, ${c} 1px, transparent 1px),` +
        `linear-gradient(${c2} 1px, transparent 1px),` +
        `linear-gradient(90deg, ${c2} 1px, transparent 1px)`,
      backgroundSize: `${size/5}px ${size/5}px, ${size/5}px ${size/5}px, ${size}px ${size}px, ${size}px ${size}px`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ───── Lined paper ─────────────────────────────────────────────────────────
function LinedPaper({ color = '#d8e7f0', bg = PJ.paper, size = 26, children, style }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: bg,
      backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${size-1}px, ${color} ${size-1}px ${size}px)`,
      ...style,
    }}>{children}</div>
  );
}

// ───── Washi tape (clickable peel) ────────────────────────────────────────
function Tape({ color = PJ.pink, w = 90, h = 22, rotate = -8, pattern = 'solid', peelable = true, style }) {
  const [peeled, setPeeled] = React.useState(false);
  const patterns = {
    solid: color,
    stripe: `repeating-linear-gradient(45deg, ${color} 0 6px, color-mix(in srgb, ${color} 75%, white) 6px 12px)`,
    dots:   `radial-gradient(circle at 4px 4px, color-mix(in srgb, ${color} 50%, white) 1.5px, transparent 2px) ${color}`,
    check:  `repeating-conic-gradient(${color} 0 25%, color-mix(in srgb, ${color} 70%, white) 0 50%) 0 0/10px 10px`,
  };
  return (
    <div
      onClick={() => peelable && setPeeled(p => !p)}
      style={{
        position: 'absolute', width: w, height: h,
        background: patterns[pattern] || patterns.solid,
        transform: `rotate(${rotate + (peeled ? -12 : 0)}deg) ${peeled ? 'translateY(-4px)' : ''}`,
        transformOrigin: '20% 50%',
        boxShadow: peeled
          ? '0 6px 14px rgba(0,0,0,0.18)'
          : '0 1px 2px rgba(0,0,0,0.08)',
        opacity: 0.92,
        cursor: peelable ? 'pointer' : 'default',
        transition: 'transform .25s cubic-bezier(.2,.7,.3,1), box-shadow .2s',
        // tape has slight transparency / texture
        backgroundBlendMode: 'multiply',
        outline: '1px solid rgba(255,255,255,0.4)',
        outlineOffset: -2,
        ...style,
      }}
    />
  );
}

// ───── Polaroid (photo with white frame + tape) ───────────────────────────
function Polaroid({ children, w = 180, h = 200, rotate = -4, caption, tapeColor = PJ.yellow, slot, slotId, slotPlaceholder = 'photo', hoverable = false, style }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => hoverable && setHover(true)}
      onMouseLeave={() => hoverable && setHover(false)}
      style={{
      position: 'absolute', width: w, height: h,
      background: '#fdfaf2',
      padding: '10px 10px 0 10px',
      boxShadow: hover
        ? '0 26px 50px rgba(0,0,0,0.28), 0 6px 10px rgba(0,0,0,0.12)'
        : '0 8px 22px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.10)',
      transform: hover
        ? `rotate(${rotate}deg) translateY(-12px) scale(1.05)`
        : `rotate(${rotate}deg)`,
      transition: 'transform .4s cubic-bezier(.5, 1.6, .35, 1), box-shadow .3s',
      cursor: hoverable ? 'pointer' : 'default',
      ...style,
    }}>
      <Tape color={tapeColor} w={w * 0.55} h={20} rotate={rotate * 1.2 - 2}
        style={{ top: -8, left: w * 0.22 }} pattern="stripe" />
      <div style={{
        width: w - 20, height: h - 48,
        background: '#e5ddc8',
        overflow: 'hidden', position: 'relative',
      }}>
        {slot ? (
          <image-slot
            id={slotId}
            placeholder={slotPlaceholder}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        ) : children}
      </div>
      {caption && (
        <div style={{
          fontFamily: '"Caveat", cursive',
          fontSize: 18,
          color: PJ.inkSoft,
          textAlign: 'center',
          paddingTop: 4,
          lineHeight: 1,
        }}>{caption}</div>
      )}
    </div>
  );
}

// ───── Torn-paper note ─────────────────────────────────────────────────────
function TornPaper({ children, w = 240, bg = PJ.paper, rotate = 0, style, padding = '20px 24px' }) {
  // jagged torn edges via clip-path polygon
  const torn = `polygon(
    0% 4%, 4% 0%, 12% 3%, 22% 0%, 35% 4%, 50% 1%, 65% 3%, 78% 0%, 90% 3%, 100% 1%,
    98% 12%, 100% 25%, 97% 40%, 100% 55%, 98% 70%, 100% 85%, 97% 95%, 100% 100%,
    88% 97%, 75% 100%, 60% 96%, 45% 100%, 30% 97%, 15% 100%, 5% 96%, 0% 98%,
    2% 85%, 0% 70%, 3% 55%, 0% 40%, 2% 25%, 0% 12%
  )`;
  return (
    <div style={{
      position: 'absolute', width: w,
      background: bg,
      padding,
      clipPath: torn,
      filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.15))',
      transform: `rotate(${rotate}deg)`,
      fontFamily: '"Patrick Hand", cursive',
      color: PJ.ink,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ───── Paper clip (SVG) ────────────────────────────────────────────────────
function PaperClip({ color = '#8a96a0', rotate = 0, size = 44, style }) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 40 64" style={{
      position: 'absolute',
      transform: `rotate(${rotate}deg)`,
      filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))',
      ...style,
    }}>
      <path d="M20 6 Q8 6 8 22 L8 48 Q8 58 20 58 Q32 58 32 48 L32 18 Q32 12 26 12 Q20 12 20 18 L20 44"
        fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ───── Sticker primitives (geometric shapes only — no figurative SVG) ─────
function StickerStar({ color = PJ.yellow, size = 60, rotate = 0, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{
      position: 'absolute', transform: `rotate(${rotate}deg)`,
      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
      ...style,
    }}>
      <path d="M50 8 L60 38 L92 38 L66 56 L76 86 L50 68 L24 86 L34 56 L8 38 L40 38 Z"
        fill={color} stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

function StickerBlob({ color = PJ.pink, size = 80, rotate = 0, style, label, labelColor = '#fff' }) {
  // organic blob shape
  return (
    <div style={{
      position: 'absolute', width: size, height: size,
      transform: `rotate(${rotate}deg)`,
      ...style,
    }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.18))',
      }}>
        <path d="M50 4 C72 4 96 22 96 48 C96 74 74 96 48 96 C22 96 4 72 6 46 C8 22 28 4 50 4 Z"
          fill={color} stroke="#fff" strokeWidth="3" />
      </svg>
      {label && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Shrikhand", serif',
          fontSize: size * 0.18,
          color: labelColor,
          textAlign: 'center',
          padding: size * 0.15,
          lineHeight: 1,
        }}>{label}</div>
      )}
    </div>
  );
}

function StickerFlower({ color = PJ.pink, center = PJ.yellow, size = 60, rotate = 0, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{
      position: 'absolute', transform: `rotate(${rotate}deg)`,
      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
      ...style,
    }}>
      {[0, 60, 120, 180, 240, 300].map(a => (
        <ellipse key={a} cx="50" cy="22" rx="14" ry="22" fill={color} stroke="#fff" strokeWidth="2"
          transform={`rotate(${a} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="12" fill={center} stroke="#fff" strokeWidth="2.5" />
    </svg>
  );
}

function StickerHeart({ color = PJ.pinkHot, size = 50, rotate = 0, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{
      position: 'absolute', transform: `rotate(${rotate}deg)`,
      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
      ...style,
    }}>
      <path d="M50 84 C50 84 12 60 12 34 C12 20 24 12 34 12 C42 12 48 18 50 24 C52 18 58 12 66 12 C76 12 88 20 88 34 C88 60 50 84 50 84 Z"
        fill={color} stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

function StickerCheck({ color = PJ.cyan, size = 50, rotate = 0, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{
      position: 'absolute', transform: `rotate(${rotate}deg)`,
      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
      ...style,
    }}>
      <circle cx="50" cy="50" r="42" fill={color} stroke="#fff" strokeWidth="3" />
      <path d="M28 52 L44 68 L72 36" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Doodle: squiggly underline
function Squiggle({ color = PJ.pink, w = 120, h = 16, rotate = 0, style, thickness = 3 }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{
      position: 'absolute', transform: `rotate(${rotate}deg)`, ...style,
    }}>
      <path d={`M2 ${h/2} Q ${w*0.15} ${h*0.05}, ${w*0.3} ${h/2} T ${w*0.6} ${h/2} T ${w*0.9} ${h/2} T ${w-2} ${h/2}`}
        fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" />
    </svg>
  );
}

// Doodle: arrow drawn by hand
function Arrow({ color = PJ.ink, w = 100, h = 60, rotate = 0, style, thickness = 3 }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{
      position: 'absolute', transform: `rotate(${rotate}deg)`, ...style,
    }}>
      <path d={`M5 ${h*0.8} Q ${w*0.3} ${h*0.2}, ${w*0.55} ${h*0.5} T ${w-12} ${h*0.4}`}
        fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" />
      <path d={`M${w-22} ${h*0.25} L ${w-8} ${h*0.42} L ${w-22} ${h*0.6}`}
        fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Doodle: hand-drawn circle (highlight)
function CircleHighlight({ color = PJ.pink, w = 120, h = 50, rotate = -3, style, thickness = 3 }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{
      position: 'absolute', transform: `rotate(${rotate}deg)`, ...style,
    }}>
      <ellipse cx={w/2} cy={h/2} rx={w/2 - 4} ry={h/2 - 3}
        fill="none" stroke={color} strokeWidth={thickness} strokeDasharray="0"
        strokeLinecap="round"
        style={{ filter: 'url(#wobble)' }} />
      {/* second pass for "drawn twice" look */}
      <ellipse cx={w/2 + 2} cy={h/2 - 1} rx={w/2 - 8} ry={h/2 - 6}
        fill="none" stroke={color} strokeWidth={thickness * 0.8} opacity="0.6" />
    </svg>
  );
}

// Drag-to-move wrapper — saves position to a key in state
function Draggable({ children, initialX = 0, initialY = 0, onDrag, zBoost = true }) {
  const [pos, setPos] = React.useState({ x: initialX, y: initialY });
  const [dragging, setDragging] = React.useState(false);
  const ref = React.useRef(null);
  const start = React.useRef({ x: 0, y: 0, px: 0, py: 0 });

  const onDown = (e) => {
    e.preventDefault(); e.stopPropagation();
    const ev = e.touches ? e.touches[0] : e;
    start.current = { x: ev.clientX, y: ev.clientY, px: pos.x, py: pos.y };
    setDragging(true);
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const ev = e.touches ? e.touches[0] : e;
      const nx = start.current.px + (ev.clientX - start.current.x);
      const ny = start.current.py + (ev.clientY - start.current.y);
      setPos({ x: nx, y: ny });
      onDrag && onDrag({ x: nx, y: ny });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging]);

  return (
    <div ref={ref}
      onMouseDown={onDown}
      onTouchStart={onDown}
      style={{
        position: 'absolute',
        left: pos.x, top: pos.y,
        cursor: dragging ? 'grabbing' : 'grab',
        zIndex: dragging && zBoost ? 999 : 'auto',
        userSelect: 'none',
        touchAction: 'none',
      }}>
      {children}
    </div>
  );
}

// Big chunky display title with optional offset shadow
function ChunkyTitle({ children, color = PJ.pink, shadow = PJ.yellow, size = 60, rotate = 0, style }) {
  return (
    <div style={{
      fontFamily: '"Shrikhand", serif',
      fontSize: size,
      color,
      lineHeight: 0.95,
      letterSpacing: '-0.01em',
      transform: `rotate(${rotate}deg)`,
      display: 'inline-block',
      textShadow: shadow ? `4px 4px 0 ${shadow}` : 'none',
      WebkitTextStroke: '0px',
      ...style,
    }}>
      {children}
    </div>
  );
}

// Handwritten title (Caveat)
function HandTitle({ children, color = PJ.pink, size = 48, rotate = 0, style, weight = 700 }) {
  return (
    <div style={{
      fontFamily: '"Caveat", cursive',
      fontWeight: weight,
      fontSize: size,
      color,
      lineHeight: 0.95,
      transform: `rotate(${rotate}deg)`,
      display: 'inline-block',
      ...style,
    }}>{children}</div>
  );
}

// Small label sticker (like an inventory tag)
function TagSticker({ label, color = PJ.yellow, rotate = -4, style }) {
  return (
    <div style={{
      position: 'absolute',
      background: color,
      color: PJ.ink,
      fontFamily: '"Patrick Hand", cursive',
      fontSize: 14,
      padding: '4px 10px',
      transform: `rotate(${rotate}deg)`,
      boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
      clipPath: 'polygon(8% 0, 100% 0, 100% 100%, 0 100%, 0 12%)',
      ...style,
    }}>{label}</div>
  );
}

// ─── Responsive viewport hook ───────────────────────────────────────────────
function useIsMobile(bp = 768) {
  const [m, setM] = React.useState(() => typeof window !== 'undefined' && window.innerWidth <= bp);
  React.useEffect(() => {
    const fn = () => setM(window.innerWidth <= bp);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, [bp]);
  return m;
}

// ─── Shared edit context (used by Landing, AboutPage, etc.) ─────────────────
// Provides a boolean `edit` value. Default true so pages without a Provider
// are always in edit mode (safe fallback — no content disappears).
const PageEditCtx = React.createContext(true);

// ─── Can this copy be edited? ───────────────────────────────────────────────
// Editing (the Edit/Preview toolbar, inline contentEditable, drag-drop image
// slots, add/remove section chrome) is only available inside the Omelette
// editor, which injects window.omelette.writeFile. When the site is published
// to any normal static host that bridge is absent, so every page locks to
// Preview automatically and visitors get a clean, read-only site. Setting
// window.__PREVIEW_ONLY__ = true forces the same lock even inside the editor.
window.siteCanEdit = function () {
  return !window.__PREVIEW_ONLY__ && !!(window.omelette && window.omelette.writeFile);
};

// ─── Shared page toolbar (Edit / Preview / Save) ──────────────────────────
// Drop inside any page that wraps itself in <PageEditCtx.Provider value={edit}>.
// extraPrefixes: additional localStorage key prefixes to include in the save
// (beyond the default cs:{pageKey}: prefix). e.g. ['land:', 'col:', 'rm:']
function PageEditToolbar({ edit, setEdit, pageKey, extraPrefixes }) {
  const [saved, setSaved] = React.useState(false);
  React.useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail.pageKey === pageKey) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
      }
    };
    window.addEventListener('cs-sidecar-saved', handler);
    return () => window.removeEventListener('cs-sidecar-saved', handler);
  }, [pageKey]);

  const doSave = () => {
    if (window.csSidecarSave) window.csSidecarSave(pageKey, extraPrefixes);
  };

  return (
    <div className="cs-toolbar" contentEditable={false}>
      <button className={`cs-tg ${edit ? 'on' : ''}`} onClick={() => setEdit(true)}>✎ Edit</button>
      <button className={`cs-tg ${!edit ? 'on' : ''}`} onClick={() => setEdit(false)}>◉ Preview</button>
      <span className="cs-tb-div" />
      <button className="cs-tb-save" title="Save to project — synced across devices" onClick={doSave}>
        {saved ? '✓ Saved' : '💾 Save'}
      </button>
    </div>
  );
}

Object.assign(window, {
  PJ, GraphPaper, LinedPaper, Tape, Polaroid, TornPaper, PaperClip,
  StickerStar, StickerBlob, StickerFlower, StickerHeart, StickerCheck,
  Squiggle, Arrow, CircleHighlight, Draggable, ChunkyTitle, HandTitle, TagSticker,
  PageEditCtx, PageEditToolbar, useIsMobile,
});
