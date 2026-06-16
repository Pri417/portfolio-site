// case-study-blocks.jsx
// Editable, reusable section components for the case-study builder.
// Each body section receives { s, ops }; text renders through <Editable>,
// images through <image-slot> (persisted by id). Hero / meta / next receive
// a value object + an `update(patch)` committer.

// ─── parallax hook (scroll-driven translate) ─────────────────────────────
function useParallax(speed = 0.3) {
  const ref = React.useRef(null);
  const [y, setY] = React.useState(0);
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < -vh || rect.top > vh * 1.5) return;
      const centre = rect.top + rect.height / 2;
      setY((centre - vh / 2) * -speed);
    };
    const onScroll = () => {if (!raf) raf = requestAnimationFrame(update);};
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);
  return [ref, y];
}

// Scale a fixed-design-width block down to fit its container (never up).
// Used by the absolute-positioned collages (gallery, pinboard) so the
// composition stays intact at every viewport instead of overflowing on
// tablet/phone widths. Returns [ref-for-container, scale].
function useFitScale(designW) {
  const ref = React.useRef(null);
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w) setScale(Math.min(1, w / designW));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [designW]);
  return [ref, scale];
}

// Small round +/- control used inside galleries, process, metrics.
function ItemCtl({ onAdd, onRemove, canRemove = true, label = 'item' }) {
  const { edit } = React.useContext(EditCtx);
  if (!edit) return null;
  return (
    <div className="cs-itemctl" contentEditable={false}>
      <button onClick={onRemove} disabled={!canRemove} title={`Remove ${label}`}>−</button>
      <span>{label}s</span>
      <button onClick={onAdd} title={`Add ${label}`}>+</button>
    </div>);

}

// ─── HERO ─────────────────────────────────────────────────────────────────
function CSHero({ hero, update }) {
  const { pageKey, edit } = React.useContext(EditCtx);
  const [pxRef, py] = useParallax(0.28);
  const heroSlotRef = React.useRef(null);
  const hHid = (k) => hero.hidden && hero.hidden[k];
  const hSet = (k, v) => update({ hidden: { ...(hero.hidden || {}), [k]: v } });
  const hDel = (k, node, label) =>
  <Deletable label={label || k} hidden={hHid(k)} onHide={() => hSet(k, true)} onShow={() => hSet(k, false)}>{node}</Deletable>;

  return (
    <section ref={pxRef} className="cs-hero" style={{
      position: 'relative', height: '100vh', minHeight: 640,
      width: '100%', overflow: 'hidden',
      background: hero.bg || 'linear-gradient(157deg, var(--peach) 0%, var(--soft-pink) 32%, var(--pink) 66%, var(--burgundy) 100%)'
    }}>
      {/* Full-bleed parallax image (covers the gradient once dropped) */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '-10%', bottom: '-10%',
        transform: `translate3d(0, ${py}px, 0)`, willChange: 'transform'
      }}>
        <image-slot ref={heroSlotRef} id={imgId(pageKey, 'hero', 'img')} placeholder="drop hero image"
        src={hero.img || undefined}
        style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {/* Upload affordance — the slot's own Replace control renders below the
             full-height hero (off-screen), so surface a reachable button here. */}
      {edit &&
      <div contentEditable={false} style={{
        position: 'absolute', top: 88, right: 28, zIndex: 5,
        display: 'flex', gap: 8
      }}>
          <button
          onClick={() => {const s = heroSlotRef.current;if (s && s.replace) s.replace();}}
          style={{
            appearance: 'none', border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: 999, padding: '9px 16px', cursor: 'pointer',
            background: 'rgba(43,8,20,0.55)', color: '#fff', backdropFilter: 'blur(8px)',
            font: '600 13px/1 var(--font-ui), system-ui, sans-serif', letterSpacing: '0.01em'
          }}>
            Upload image
          </button>
          {true &&
        <button
          onClick={() => {const s = heroSlotRef.current;if (s && s.reframe) s.reframe();}}
          title="Drag to reposition · corner-drag to resize"
          style={{
            appearance: 'none', border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: 999, padding: '9px 16px', cursor: 'pointer',
            background: 'rgba(43,8,20,0.55)', color: '#fff', backdropFilter: 'blur(8px)',
            font: '600 13px/1 var(--font-ui), system-ui, sans-serif', letterSpacing: '0.01em'
          }}>
              Reposition
            </button>
        }
        </div>
      }

      {/* Legibility scrim — keeps the deep base under the title */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(43,8,20,0.28) 0%, rgba(43,8,20,0) 28%, rgba(43,8,20,0) 46%, rgba(43,8,20,0.62) 100%)'
      }} />

      <div className="cs-hero-bottom" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 80px 76px' }}>
        <div className="cs-hero-grid" style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '7fr 5fr', alignItems: 'end', gap: 56
        }}>
          <div>
            {hDel('eyebrow',
            <Editable tag="div" value={hero.eyebrow}
            onCommit={(v) => update({ eyebrow: v })}
            placeholder="eyebrow · year"
            style={{
              fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--soft-pink)', marginBottom: 22
            }} />,
            'eyebrow')}
            <Editable tag="h1" value={hero.title}
            onCommit={(v) => update({ title: v })}
            placeholder="Project title"
            style={{
              margin: 0, fontFamily: 'var(--font-headline)',
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 700',
              fontSize: 'clamp(58px, 9vw, 128px)', lineHeight: 0.94,
              letterSpacing: '-0.025em', color: '#fff', textWrap: 'balance'
            }} />
            {hDel('sub',
            <Editable tag="div" value={hero.sub}
            onCommit={(v) => update({ sub: v })}
            placeholder="a short tag line"
            style={{
              marginTop: 16, fontFamily: 'var(--font-script)', fontSize: 32,
              color: 'var(--soft-pink)', transform: 'rotate(-1.5deg)',
              transformOrigin: 'left center', display: 'inline-block'
            }} />,
            'tag line')}
          </div>
          {hDel('description',
          <Editable tag="p" value={hero.description}
          onCommit={(v) => update({ description: v })}
          placeholder="A short description that overlays the hero…"
          style={{
            margin: '0 0 12px', fontFamily: 'var(--font-ui)',
            fontSize: 17, lineHeight: 1.65, color: 'rgba(255,255,255,0.94)', maxWidth: 440
          }} />,
          'description')}
        </div>
      </div>

      <div style={{
        position: 'absolute', left: '50%', bottom: 20, transform: 'translateX(-50%)',
        textAlign: 'center', color: 'rgba(255,255,255,0.85)', pointerEvents: 'none'
      }}>
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.24em', textTransform: 'uppercase'
        }}>scroll</div>
        <div style={{ fontSize: 18, marginTop: 4, animation: 'bounceDown 1.8s ease-in-out infinite' }}>↓</div>
      </div>
    </section>);

}

// ─── META STRIP ────────────────────────────────────────────────────────────
function CSMeta({ meta, update }) {
  return (
    <section style={{ padding: '64px 0' }}>
      <div className="cs-wrap">
        <div className="reveal" style={{
          display: 'flex', flexWrap: 'wrap', columnGap: 56, rowGap: 32,
          borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
          padding: '32px 0'
        }}>
          {meta.map((it, i) =>
          <div key={i}>
              <Editable tag="div" value={it.label}
            onCommit={(v) => update(meta.map((m, j) => j === i ? { ...m, label: v } : m))}
            placeholder="Label"
            style={{
              fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--pink)', marginBottom: 10, whiteSpace: 'nowrap'
            }} />
              <Editable tag="div" value={it.value}
            onCommit={(v) => update(meta.map((m, j) => j === i ? { ...m, value: v } : m))}
            placeholder="Value"
            style={{
              fontFamily: 'var(--font-headline)',
              fontVariationSettings: '"opsz" 144, "SOFT" 50, "wght" 500',
              fontSize: 22, lineHeight: 1.2, color: 'var(--ink)', whiteSpace: 'nowrap'
            }} />
            </div>
          )}
        </div>
        <ItemCtl
          label="field"
          canRemove={meta.length > 1}
          onAdd={() => update([...meta, { label: 'Partners', value: '' }])}
          onRemove={() => update(meta.slice(0, -1))} />
      </div>
    </section>);

}

// ─── INTRO ──────────────────────────────────────────────────────────────────
function CSIntro({ s, ops }) {
  const { edit } = React.useContext(EditCtx);
  const up = (patch) => ops.update(s.id, patch);
  const hasAside = !!(s.pullquote && String(s.pullquote).replace(/<[^>]*>/g, '').trim());
  const maxW = s.narrow ? (s.narrowW || 480) : (hasAside ? undefined : 860);
  return (
    <section style={{ padding: s.tight ? '64px 0 0' : '64px 0', background: 'transparent' }}>
      <div className="cs-wrap">
        {edit &&
        <div style={{ marginBottom: 10, display: 'flex', gap: 8 }}>
          <button contentEditable={false}
          onClick={() => up({ narrow: !s.narrow })}
          style={{
            fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            background: s.narrow ? 'var(--burgundy)' : 'var(--peach)',
            color: s.narrow ? '#fff' : 'var(--ink-muted)',
            border: '1px solid var(--border)', borderRadius: 999,
            padding: '4px 12px', cursor: 'pointer'
          }}>◀▶ {s.narrow ? 'Wide' : 'Narrow'}</button>
        </div>
        }
        <div className="cs-intro-grid" style={{
          display: 'grid', gridTemplateColumns: hasAside ? '7fr 4fr' : '1fr',
          gap: 80, alignItems: 'start', maxWidth: maxW
        }}>
          <div className="reveal from-left">
            <Editable tag="div" value={s.eyebrow} onCommit={(v) => up({ eyebrow: v })}
            placeholder="Eyebrow" className="type-eyebrow" style={{ marginBottom: 18 }} />
            {(edit || s.heading) &&
            <Editable tag="h2" value={s.heading} onCommit={(v) => up({ heading: v })}
            placeholder="Section heading"
            style={s.headStyle === 'script' ? {
              margin: '0 0 28px', fontFamily: 'var(--font-script)',
              fontSize: 'clamp(46px, 5.2vw, 72px)', lineHeight: 1.02,
              letterSpacing: 0, fontWeight: 700,
              color: s.headColor || 'var(--orange)', textWrap: 'balance'
            } : {
              margin: '0 0 28px', fontFamily: 'var(--font-headline)',
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
              fontSize: 48, lineHeight: 1.05, letterSpacing: '-0.015em',
              color: s.headColor || 'var(--ink)', textWrap: 'balance'
            }} />
            }
            <Editable tag="p" value={s.body} onCommit={(v) => up({ body: v })}
            placeholder="Body copy…" className="cs-intro-body"
            style={{
              margin: 0, fontFamily: 'var(--font-ui)', fontSize: 19, lineHeight: 1.65,
              color: 'var(--ink-soft)', textWrap: 'pretty', whiteSpace: 'pre-line'
            }} />
          </div>
          {hasAside &&
          <aside className="reveal from-right" style={{
            borderLeft: '3px solid var(--pink)', padding: '6px 0 6px 26px', marginTop: 80
          }}>
            <Editable tag="div" value={s.pullquote} onCommit={(v) => up({ pullquote: v })}
            placeholder="Optional pull-quote…"
            style={{
              fontFamily: 'var(--font-headline)',
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 500',
              fontStyle: 'italic', fontSize: 26, lineHeight: 1.3, color: 'var(--orange)'
            }} />
          </aside>
          }
        </div>
      </div>
    </section>);

}

// ─── PASSWORD GATE ───────────────────────────────────────────────────────────
// A section that locks everything below it until the visitor enters the
// password. In Edit mode the whole page is visible and the password is
// editable; in Preview the gate hides the sections that follow until unlocked.
function CSGate({ s, ops }) {
  const { edit, unlock } = React.useContext(EditCtx);
  const up = (patch) => ops.update(s.id, patch);
  const expected = (s.password || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

  const inputRef = React.useRef(null);
  const [err, setErr] = React.useState(false);

  const submit = (e) => {
    if (e) e.preventDefault();
    const attempt = (inputRef.current ? inputRef.current.value : '').trim().toLowerCase();
    if (expected && attempt === expected.toLowerCase()) {
      unlock();
      window.scrollTo(0, 0);
    } else {
      setErr(true);
      window.setTimeout(() => setErr(false), 700);
    }
  };

  return (
    <section style={{ padding: '64px 0' }}>
      <div className="cs-wrap">
        <div className={`reveal cs-gate${err ? ' shake' : ''}`} style={{
          maxWidth: 640, margin: '0 auto', textAlign: 'center',
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 22,
          padding: '56px 56px 56px',
          boxShadow: '0 30px 60px rgba(46,37,34,0.10), 0 4px 10px rgba(46,37,34,0.05)',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* lock badge */}
          <div style={{
            width: 72, height: 72, margin: '0 auto 26px', borderRadius: '50%',
            background: 'var(--burgundy)', display: 'grid', placeItems: 'center',
            boxShadow: '0 12px 24px rgba(107,10,32,0.28)'
          }} contentEditable={false}>
            <svg width="30" height="34" viewBox="0 0 30 34" fill="none" aria-hidden="true">
              <rect x="4" y="14" width="22" height="17" rx="4" fill="var(--soft-pink)" />
              <path d="M9 14V10a6 6 0 0 1 12 0v4" stroke="var(--soft-pink)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="15" cy="21" r="2.6" fill="var(--burgundy)" />
              <rect x="13.8" y="22.4" width="2.4" height="5" rx="1.2" fill="var(--burgundy)" />
            </svg>
          </div>

          <Editable tag="div" value={s.eyebrow} onCommit={(v) => up({ eyebrow: v })}
          placeholder="Eyebrow" className="type-eyebrow"
          style={{ marginBottom: 16, textAlign: 'center' }} />
          <Editable tag="h2" value={s.heading} onCommit={(v) => up({ heading: v })}
          placeholder="This project is protected."
          style={{
            margin: '0 0 18px', fontFamily: 'var(--font-headline)',
            fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
            fontSize: 38, lineHeight: 1.06, letterSpacing: '-0.015em',
            color: 'var(--ink)', textWrap: 'balance'
          }} />
          <Editable tag="p" value={s.body} onCommit={(v) => up({ body: v })}
          placeholder="Explain why it's protected…"
          style={{
            margin: '0 auto 30px', maxWidth: 470, fontFamily: 'var(--font-ui)',
            fontSize: 17, lineHeight: 1.6, color: 'var(--ink-soft)', textWrap: 'pretty'
          }} />

          {edit ?
          <div className="cs-gate-setrow" contentEditable={false}>
              <span className="cs-field-label">Password</span>
              <Editable tag="span" value={s.password} onCommit={(v) => up({ password: v })}
            placeholder="set a password"
            style={{ fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 700, color: 'var(--burgundy)' }} />
              <span style={{ color: 'var(--ink-muted)', fontSize: 12, fontFamily: 'var(--font-ui)' }}>
                — visitors type this in Preview
              </span>
            </div> :

          <form onSubmit={submit} className="cs-gate-form">
              <div className={`cs-gate-field${err ? ' err' : ''}`}>
                <input ref={inputRef} type="password" autoComplete="off"
              defaultValue=""
              onKeyDown={(e) => { if(e.key==='Enter'){ e.preventDefault(); submit(); } }}
              onChange={() => setErr(false)}
              placeholder="Enter password" aria-label="Password" />
              </div>
              <button type="submit" className="btn btn-primary cs-gate-btn">
                {s.button || 'Unlock'}
              </button>
            </form>
          }

          {!edit &&
          <div className="cs-gate-msg">
              {err ?
            <span style={{ color: 'var(--orange)' }}>That’s not it — try again, or reach out for access.</span> :
            s.hint ? <span style={{ fontFamily: 'var(--font-script)', fontSize: 19, color: 'var(--ink-muted)' }}>{s.hint}</span> : null}
            </div>
          }
          {edit &&
          <Editable tag="div" value={s.hint} onCommit={(v) => up({ hint: v })}
          placeholder="Optional hint shown under the field…"
          style={{ marginTop: 16, fontFamily: 'var(--font-script)', fontSize: 19, color: 'var(--ink-muted)' }} />
          }
        </div>
      </div>
    </section>);

}

// ─── FULL IMAGE ──────────────────────────────────────────────────────────────
function CSFullImage({ s, ops }) {
  const { pageKey } = React.useContext(EditCtx);
  const [pxRef, py] = useParallax(0.16);
  const h = s.height || 640;

  // Caption can render as a small script line (default), a serif heading
  // title, or a large hand-scripted line that rises up on reveal.
  const capFont = s.captionScript ? {
    fontFamily: 'var(--font-script)', fontWeight: 700,
    fontSize: 'clamp(40px, 5.6vw, 66px)', lineHeight: 1.0, letterSpacing: '0.3px',
    color: s.captionColor || 'var(--pink)', textWrap: 'balance'
  } : s.captionHeading ? {
    fontFamily: 'var(--font-headline)',
    fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
    fontSize: 'clamp(28px, 3.4vw, 44px)', lineHeight: 1.1,
    letterSpacing: '-0.015em', color: 'var(--ink)', textWrap: 'balance'
  } : { fontFamily: 'var(--font-script)', fontSize: s.captionSize || 20, color: 'var(--ink-muted)' };
  const capTag = (s.captionHeading || s.captionScript) ? 'h3' : 'div';
  const capClass = s.captionScript ? 'cs-caption-rise' : '';

  // Natural mode (s.ar set): show the whole image at its own aspect ratio —
  // no crop, no background box, no parallax overflow. Sits in the content
  // column like a printed plate.
  if (s.ar) {
    const box = {
      position: 'relative', width: '100%', aspectRatio: String(s.ar)
    };
    if (s.maxW) {box.maxWidth = s.maxW;box.marginLeft = 'auto';box.marginRight = 'auto';}
    return (
      <section className={`reveal${s.bare ? ' cs-fi-bare' : ''}`} style={{ padding: s.tight ? '0 0 20px' : '64px 0' }}>
        <div className="cs-wrap">
          {(s.title || ops) &&
          <Editable tag="h3" value={s.title} onCommit={(v) => ops.update(s.id, { title: v })}
          placeholder="Add a title above this image…"
          style={{
            margin: '0 0 20px', fontFamily: 'var(--font-headline)',
            fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
            fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--ink)'
          }} />
          }
          <div style={box}>
            <image-slot id={imgId(pageKey, s.id, 'img')} placeholder="drop full-width image"
            src={s.img || undefined} fit="contain"
            style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
          <Editable tag={capTag} className={capClass} value={s.caption} onCommit={(v) => ops.update(s.id, { caption: v })}
          placeholder="Add a caption…"
          style={{ marginTop: 14, ...capFont }} />
        </div>
      </section>);

  }

  // Contain mode: show full image uncropped inside a fixed-height box
  if (s.fit === 'contain') {
    return (
      <section className="reveal" style={{ padding: s.tight ? '0 0 20px' : '64px 0' }}>
        <div style={{
          position: 'relative', width: '100%', height: h, background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <image-slot id={imgId(pageKey, s.id, 'img')} placeholder="drop full-width image"
          src={s.img || undefined} fit="contain"
          style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
        <div className="cs-wrap" style={{ marginTop: 14 }}>
          <Editable tag={capTag} className={capClass} value={s.caption} onCommit={(v) => ops.update(s.id, { caption: v })}
          placeholder="Add a caption…"
          style={{ ...capFont }} />
        </div>
      </section>);
  }

  return (
    <section className="reveal" style={{ padding: s.tight ? '0 0 20px' : '64px 0' }}>
      <div ref={pxRef} style={{
        position: 'relative', width: '100%', height: h, overflow: 'hidden',
        background: s.noBg ? 'transparent' : 'var(--peach)',
        maxWidth: s.maxW || undefined, marginLeft: s.maxW ? 'auto' : undefined, marginRight: s.maxW ? 'auto' : undefined
      }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '-10%', bottom: '-10%',
          transform: `translate3d(0, ${py}px, 0)`, willChange: 'transform'
        }}>
          <image-slot id={imgId(pageKey, s.id, 'img')} placeholder="drop full-width image"
          src={s.img || undefined}
          style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
      </div>
      <div className="cs-wrap" style={{ marginTop: 14 }}>
        <Editable tag={capTag} className={capClass} value={s.caption} onCommit={(v) => ops.update(s.id, { caption: v })}
        placeholder="Add a caption…"
        style={{ ...capFont }} />
      </div>
    </section>);

}

// ─── IMAGE + TEXT ──────────────────────────────────────────────────────────
function CSImageText({ s, ops }) {
  const { pageKey, edit } = React.useContext(EditCtx);
  const up = (patch) => ops.update(s.id, patch);
  const isLeft = (s.side || 'left') === 'left';
  const rotate = s.rotate || 0;
  // Treat <br>/&nbsp;/empty markup as blank so empty heading & body don't
  // reserve dead vertical space (a clean label-only image section).
  const csIsBlank = (v) => !String(v == null ? '' : v)
    .replace(/<br\s*\/?>/gi, '').replace(/&nbsp;/gi, ' ').replace(/<[^>]*>/g, '').trim();
  const headingBlank = csIsBlank(s.heading);
  const bodyBlank = csIsBlank(s.body);

  // Natural mode (s.ar set): whole image at its own aspect ratio, no crop,
  // no background box, no rotation — matches a clean editorial layout.
  const natural = !!s.ar;
  // Pair mode: two portrait screens shown side-by-side in the image column
  // (slightly tilted, scrapbook-style) instead of one large image plus a
  // second image crammed under the body copy.
  const pair = !!s.pair && (s.img2slot || s.img2 || s.img2Ar);
  const pairH = s.pairH || 520;

  // Natural mode: size the image box to the dropped image's true ratio
  // (overrides the stored s.ar so it's never stretched or letterboxed).
  React.useEffect(() => {
    if (pair) return;
    const ids = [];
    if (s.tiles) { s.tiles.forEach((_, i) => ids.push('tile' + i)); }
    else if (natural) { ids.push('img'); if (s.img2under) ids.push('img2'); }
    if (!ids.length) return;
    const cleanups = [];
    ids.forEach((part) => {
      const slot = document.getElementById(imgId(pageKey, s.id, part));
      if (!slot || !slot.shadowRoot) return;
      const box = slot.parentElement;
      const img = slot.shadowRoot.querySelector('.frame img');
      if (!box || !img) return;
      const apply = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        if (w && h && slot.hasAttribute('data-filled')) box.style.aspectRatio = w + ' / ' + h;
      };
      apply();
      img.addEventListener('load', apply);
      const mo = new MutationObserver(apply);
      mo.observe(slot, { attributes: true, attributeFilter: ['data-filled'] });
      cleanups.push(() => { img.removeEventListener('load', apply); mo.disconnect(); });
    });
    return () => { cleanups.forEach((fn) => fn()); };
  }, [pageKey, s.id, natural, pair, s.img2under, s.tiles && s.tiles.length]);

  const imgCol = pair ?
  <div className={`reveal ${isLeft ? 'from-left' : 'from-right'}`}
  style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
    gap: 22, flexWrap: 'nowrap' }}>
      <div style={{
      position: 'relative', height: pairH, aspectRatio: String(s.ar),
      transform: 'rotate(-2.5deg)', flex: '0 0 auto',
      filter: 'drop-shadow(0 22px 40px rgba(46,37,34,0.18))'
    }}>
        <image-slot id={imgId(pageKey, s.id, 'img')} placeholder="drop image"
      src={s.img || undefined} fit="contain"
      style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
      <div style={{
      position: 'relative', height: pairH * 0.86,
      aspectRatio: String(s.img2Ar || 0.61),
      transform: 'rotate(2.5deg)', flex: '0 0 auto', marginBottom: pairH * 0.05,
      filter: 'drop-shadow(0 22px 40px rgba(46,37,34,0.18))'
    }}>
        <image-slot id={imgId(pageKey, s.id, 'img2')} placeholder="drop image"
      src={s.img2 || undefined} fit="contain"
      style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div> :

  <div className={`reveal ${isLeft ? 'from-left' : 'from-right'}`}>
      {s.video ? (() => {
        const ve = (typeof window !== 'undefined' && window.toEmbed) ? window.toEmbed(s.videoUrl) : null;
        return (
        <div>
          <div style={{
            position: 'relative', width: '100%', aspectRatio: '16 / 9',
            maxWidth: s.maxW || undefined,
            marginLeft: s.maxW ? 'auto' : undefined, marginRight: s.maxW ? 'auto' : undefined,
            transform: rotate ? `rotate(${rotate}deg)` : undefined,
            background: '#000', borderRadius: 10, overflow: 'hidden',
            boxShadow: '0 28px 50px rgba(46,37,34,0.16), 0 6px 12px rgba(46,37,34,0.08)'
          }}>
            {ve && ve.kind === 'iframe' &&
            <iframe src={ve.src} title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen frameBorder="0"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
            }
            {ve && ve.kind === 'video' &&
            <video key={ve.src} src={ve.src} controls playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            }
            {!ve &&
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(255,255,255,0.88)',
              fontFamily: 'var(--font-ui)',
              background: 'repeating-linear-gradient(45deg,#1b1b1b,#1b1b1b 14px,#232323 14px,#232323 28px)'
            }}>
                <div style={{ width: 0, height: 0, borderTop: '13px solid transparent', borderBottom: '13px solid transparent', borderLeft: '22px solid rgba(255,255,255,0.9)', marginLeft: 5 }} />
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>Video placeholder</div>
                {edit && <div style={{ fontSize: 12, opacity: 0.7 }}>Paste a link or video path below</div>}
              </div>
            }
          </div>
          {edit &&
          <div className="cs-video-input" contentEditable={false} style={{ marginTop: 12 }}>
              <span className="cs-field-label">Video URL</span>
              <input type="text" defaultValue={s.videoUrl}
            placeholder="YouTube / Vimeo / videos/clip.mp4"
            onBlur={(e) => up({ videoUrl: e.target.value })} />
            </div>
          }
        </div>);
      })() : s.tiles ? (
      <div style={s.scatter ? {
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        columnGap: 56, rowGap: 12, paddingTop: 30, paddingBottom: 40
      } : {
        display: 'grid',
        gridTemplateColumns: s.tilesRow ? `repeat(${s.tiles.length}, 1fr)` : '1fr',
        gap: s.tilesRow ? 28 : 30, alignItems: 'start'
      }}>
        {s.tiles.map((t, i) => {
          const tilt = [-3, 2.5, -2, 3, -1.5, 2][i % 6];
          const offset = [0, 64, 30, 86, 14, 52][i % 6];
          const figStyle = s.scatter
            ? { margin: 0, width: 'calc(50% - 28px)', marginTop: offset, transform: `rotate(${tilt}deg)` }
            : { margin: 0, transform: `rotate(${tilt}deg)` };
          return (
          <figure key={i} style={figStyle}>
            <div style={{
              position: 'relative', width: '100%',
              aspectRatio: String(t.ar || s.tilesAr || 1.4),
              filter: 'drop-shadow(0 18px 34px rgba(46,37,34,0.16))'
            }}>
              <image-slot id={imgId(pageKey, s.id, 'tile' + i)} placeholder="drop image"
                src={t.img || undefined} fit="contain"
                style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
            <Editable tag="figcaption" value={t.title}
              onCommit={(v) => up({ tiles: s.tiles.map((x, j) => j === i ? { ...x, title: v } : x) })}
              placeholder="Image title…"
              style={{
                marginTop: 12, textAlign: 'center',
                fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600,
                letterSpacing: '0.01em', color: 'var(--ink-soft)'
              }} />
          </figure>);
        })}
        {edit &&
        <div contentEditable={false} style={{ justifySelf: 'center', gridColumn: '1 / -1', flexBasis: '100%', display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <ItemCtl label="image"
            canRemove={s.tiles.length > 1}
            onAdd={() => up({ tiles: [...s.tiles, { title: '' }] })}
            onRemove={() => up({ tiles: s.tiles.slice(0, -1) })} />
        </div>
        }
      </div>
      ) : (
      <div style={{
      position: 'relative',
      height: natural ? 'auto' : (s.imgH || 520),
      aspectRatio: natural ? String(s.ar) : undefined,
      maxWidth: s.maxW || undefined,
      marginLeft: s.maxW ? 'auto' : undefined,
      marginRight: s.maxW ? 'auto' : undefined,
      transform: rotate ? `rotate(${rotate}deg)` : undefined,
      boxShadow: natural ? 'none' : '0 28px 50px rgba(46,37,34,0.16), 0 6px 12px rgba(46,37,34,0.08)',
      background: natural ? 'transparent' : 'var(--peach)',
      overflow: natural ? 'visible' : 'hidden'
    }}>
        <image-slot id={imgId(pageKey, s.id, 'img')} placeholder="drop image"
      src={s.img || undefined} fit={natural ? 'contain' : undefined}
      style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
      )}
      {!s.video && s.img2under &&
      <div style={{
        position: 'relative',
        height: natural ? 'auto' : (s.imgH || 520),
        aspectRatio: natural ? String(s.img2underAr || s.ar) : undefined,
        maxWidth: s.maxW || undefined,
        marginTop: 26,
        marginLeft: s.maxW ? 'auto' : undefined,
        marginRight: s.maxW ? 'auto' : undefined,
        transform: `rotate(${s.img2under === true ? 2.5 : s.img2under}deg)`,
        boxShadow: natural ? 'none' : '0 28px 50px rgba(46,37,34,0.16), 0 6px 12px rgba(46,37,34,0.08)',
        background: natural ? 'transparent' : 'var(--peach)',
        overflow: natural ? 'visible' : 'hidden'
      }}>
        <image-slot id={imgId(pageKey, s.id, 'img2')} placeholder="drop image"
        src={s.img2 || undefined} fit={natural ? 'contain' : undefined}
        style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
      }
    </div>;

  const textCol =
  <div className={`reveal ${s.stack ? 'from-left' : isLeft ? 'from-right' : 'from-left'}`} style={{ paddingTop: s.stack ? 0 : 40, maxWidth: s.stack ? 820 : undefined }}>
      {edit && !s.stack &&
    <button className="cs-side-toggle" contentEditable={false}
    onClick={() => up({ side: isLeft ? 'right' : 'left' })}>
          ⇄ image on {isLeft ? 'right' : 'left'}
        </button>
    }
      <Editable tag="div" value={s.eyebrow} onCommit={(v) => up({ eyebrow: v })}
    placeholder="Eyebrow" className="type-eyebrow" style={{ marginBottom: 16 }} />
      {(edit || !headingBlank) &&
      <Editable tag="h2" value={s.heading} onCommit={(v) => up({ heading: v })}
    placeholder="Heading"
    style={{
      margin: headingBlank ? '0 0 8px' : '0 0 28px', fontFamily: 'var(--font-headline)',
      fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
      fontSize: 42, lineHeight: 1.12, letterSpacing: '-0.015em',
      color: 'var(--orange)', textWrap: 'balance'
    }} />
      }
      {(edit || !bodyBlank) &&
      <Editable tag="div" value={s.body} onCommit={(v) => up({ body: v })}
    placeholder="Body copy…"
    style={{
      fontFamily: 'var(--font-ui)', fontSize: 17, lineHeight: 1.65,
      color: 'var(--ink-soft)', textWrap: 'pretty'
    }} />
      }
      {!pair && !s.img2under && (s.img2slot || s.img2 || s.img2Ar) &&
    <div style={{ marginTop: 32 }}>
          <div style={{
        position: 'relative', width: '100%',
        height: s.img2Ar ? 'auto' : 280,
        aspectRatio: s.img2Ar ? String(s.img2Ar) : undefined,
        background: 'transparent',
        overflow: s.img2Ar ? 'visible' : 'hidden',
        boxShadow: 'none'
      }}>
            <image-slot id={imgId(pageKey, s.id, 'img2')} placeholder="drop image"
        src={s.img2 || undefined} fit={s.img2Ar ? 'contain' : undefined}
        style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </div>
    }
    </div>;

  return (
    <section style={{ padding: '64px 0' }}>
      <div className="cs-wrap">
        {s.stack ?
        <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
            {textCol}
            {imgCol}
          </div> :

        <div className="cs-it-grid" style={{
          display: 'grid', gridTemplateColumns: isLeft ? '7fr 5fr' : '5fr 7fr',
          gap: 80, alignItems: 'start'
        }}>
            {isLeft ? <>{imgCol}{textCol}</> : <>{textCol}{imgCol}</>}
          </div>
        }
      </div>
    </section>);

}

// ─── GALLERY ────────────────────────────────────────────────────────────────
const GALLERY_LAYOUT = [
{ x: 2, y: 0, w: 380, h: 480, rotate: -3 },
{ x: 38, y: 80, w: 320, h: 400, rotate: 2 },
{ x: 68, y: 0, w: 340, h: 440, rotate: -1.5 },
{ x: 14, y: 540, w: 420, h: 220, rotate: 1.5 },
{ x: 56, y: 510, w: 360, h: 250, rotate: -2 },
{ x: 30, y: 300, w: 300, h: 200, rotate: 1 }];

function CSGallery({ s, ops }) {
  const { pageKey } = React.useContext(EditCtx);
  const count = Math.max(1, Math.min(6, s.count || 4));
  const items = GALLERY_LAYOUT.slice(0, count);
  const GAL_DESIGN_W = 1080;
  const [galRef, galScale] = useFitScale(GAL_DESIGN_W);
  return (
    <section className="reveal" style={{ padding: '64px 0' }}>
      <div className="cs-wrap">
        <ItemCtl label="image"
        canRemove={count > 1}
        onAdd={() => ops.update(s.id, { count: Math.min(6, count + 1) })}
        onRemove={() => ops.update(s.id, { count: Math.max(1, count - 1) })} />
        <div ref={galRef} style={{ position: 'relative', height: 760 * galScale, width: '100%' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: GAL_DESIGN_W, height: 760,
            transform: `scale(${galScale})`, transformOrigin: 'top left'
          }}>
          {items.map((im, i) =>
          <div key={i} className="reveal" style={{
            position: 'absolute', left: `${im.x}%`, top: im.y,
            width: im.w, height: im.h, transform: `rotate(${im.rotate}deg)`,
            boxShadow: '0 28px 50px rgba(46,37,34,0.18), 0 4px 8px rgba(46,37,34,0.08)',
            background: 'var(--peach)', overflow: 'hidden'
          }}>
              <image-slot id={imgId(pageKey, s.id, `g${i}`)} placeholder="image"
            src={(s.imgs || [])[i] || undefined}
            style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
          )}
          </div>
        </div>
      </div>
    </section>);

}

// ─── PINBOARD ─────────────────────────────────────────────────────────────
// A full-bleed cork bulletin board. Artworks are pinned up as tilted photo
// cards with push-pins / washi tape and optional handwritten captions.
const PINBOARD_LAYOUT = [
  { l: 2,  t: 24,  w: 250, h: 300, r: -4,   pin: 'pin'  },
  { l: 25, t: 64,  w: 226, h: 226, r: 3,    pin: 'tape' },
  { l: 45, t: 14,  w: 270, h: 338, r: -2,   pin: 'pin'  },
  { l: 70, t: 50,  w: 244, h: 290, r: 4,    pin: 'tape' },
  { l: 6,  t: 384, w: 240, h: 248, r: 2.5,  pin: 'tape' },
  { l: 31, t: 346, w: 232, h: 296, r: -3,   pin: 'pin'  },
  { l: 55, t: 396, w: 262, h: 232, r: 2,    pin: 'pin'  },
  { l: 77, t: 372, w: 214, h: 272, r: -4,   pin: 'tape' },
  { l: 4,  t: 704, w: 246, h: 256, r: -2.5, pin: 'pin'  },
  { l: 28, t: 724, w: 234, h: 226, r: 3,    pin: 'tape' },
  { l: 51, t: 692, w: 258, h: 286, r: -3,   pin: 'pin'  },
  { l: 76, t: 716, w: 216, h: 248, r: 4,    pin: 'tape' },
];
const PIN_COLORS = ['#E6336B', '#E63E1E', '#3E7CB1', '#C4B5E0', '#1F8A5B', '#E6336B', '#E63E1E', '#3E7CB1'];
const TAPE_TINTS = ['rgba(255,236,150,0.62)', 'rgba(196,181,224,0.55)', 'rgba(255,203,213,0.6)'];

function CSPinboard({ s, ops }) {
  const { pageKey, edit } = React.useContext(EditCtx);
  const count = Math.max(1, Math.min(12, s.count || 8));
  const items = PINBOARD_LAYOUT.slice(0, count);
  // Each card keeps its layout width but takes its dropped image's true height
  // (no letterbox). picH[i] holds the measured height; absent → layout default.
  const [picH, setPicH] = React.useState({});
  React.useEffect(() => {
    const cleanups = [];
    items.forEach((im, i) => {
      const slot = document.getElementById(imgId(pageKey, s.id, `p${i}`));
      if (!slot) return;
      const apply = () => {
        const img = slot.shadowRoot && slot.shadowRoot.querySelector('.frame img');
        if (img && img.naturalWidth && img.naturalHeight && slot.hasAttribute('data-filled')) {
          const h = Math.round(im.w * img.naturalHeight / img.naturalWidth);
          setPicH((prev) => prev[i] === h ? prev : { ...prev, [i]: h });
        } else {
          setPicH((prev) => { if (!(i in prev)) return prev; const n = { ...prev }; delete n[i]; return n; });
        }
      };
      apply();
      const img = slot.shadowRoot && slot.shadowRoot.querySelector('.frame img');
      if (img) { img.addEventListener('load', apply); cleanups.push(() => img.removeEventListener('load', apply)); }
      const mo = new MutationObserver(apply);
      mo.observe(slot, { attributes: true, attributeFilter: ['data-filled', 'src'] });
      cleanups.push(() => mo.disconnect());
    });
    return () => cleanups.forEach((fn) => fn());
  }, [pageKey, s.id, count, JSON.stringify(s.imgs || [])]);
  const boardH = Math.max(...items.map((im, i) => im.t + (picH[i] || im.h) + 96)) + 28;
  const caps = s.caps || [];
  const setCap = (i, v) => {
    const next = [...caps]; next[i] = v;
    ops.update(s.id, { caps: next });
  };
  const up = (patch) => ops.update(s.id, patch);
  const bodyBlank = !String(s.body || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, '').trim();
  const PIN_DESIGN_W = 1284;
  const [boardRef, boardScale] = useFitScale(PIN_DESIGN_W);

  return (
    <section className="reveal" style={{ padding: '64px 0' }}>
      <div className="cs-wrap" style={{ textAlign: 'center', marginBottom: 30 }}>
        <Editable tag="div" value={s.eyebrow} onCommit={(v) => up({ eyebrow: v })}
          placeholder="Eyebrow"
          style={{
            fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--pink)',
            marginBottom: 10
          }} />
        <Editable tag="h2" value={s.heading} onCommit={(v) => up({ heading: v })}
          placeholder="Section heading…"
          style={{
            margin: 0, fontFamily: 'var(--font-headline)',
            fontVariationSettings: '"opsz" 144, "SOFT" 60, "wght" 600',
            fontSize: 'clamp(34px, 4.4vw, 56px)', lineHeight: 1.02,
            letterSpacing: '-0.02em', color: 'var(--orange)', textWrap: 'balance'
          }} />
        {(edit || !bodyBlank) &&
        <Editable tag="p" value={s.body} onCommit={(v) => up({ body: v })}
          placeholder="Add body text…"
          style={{
            margin: '18px auto 0', maxWidth: 660,
            fontFamily: 'var(--font-ui)', fontSize: 17, fontWeight: 400,
            lineHeight: 1.6, color: 'var(--ink-soft)', textWrap: 'pretty'
          }} />
        }
      </div>

      <div style={{
        width: 'min(94vw, 1320px)', margin: '0 auto',
        padding: 18, borderRadius: 10,
        background: 'linear-gradient(150deg, #4a3833, #2e2522)',
        boxShadow: '0 40px 80px rgba(46,37,34,0.30), 0 8px 18px rgba(46,37,34,0.18), inset 0 2px 3px rgba(255,255,255,0.14), inset 0 -3px 6px rgba(0,0,0,0.3)'
      }}>
        <div ref={boardRef} style={{
          position: 'relative', height: boardH * boardScale, borderRadius: 3, overflow: 'hidden',
          backgroundColor: '#6B0A20',
          backgroundImage: [
            'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.28) 0.7px, transparent 1.4px)',
            'radial-gradient(circle at 50% 50%, rgba(255,160,175,0.16) 0.7px, transparent 1.4px)',
            'radial-gradient(circle at 50% 50%, rgba(40,0,8,0.25) 1px, transparent 1.6px)'
          ].join(','),
          backgroundSize: '7px 7px, 11px 11px, 17px 17px',
          backgroundPosition: '0 0, 3px 4px, 8px 2px',
          boxShadow: 'inset 0 0 80px rgba(30,0,8,0.55)'
        }}>
          <ItemCtl label="art"
            canRemove={count > 1}
            onAdd={() => up({ count: Math.min(12, count + 1) })}
            onRemove={() => up({ count: Math.max(1, count - 1) })} />
          <div style={{
            position: 'absolute', top: 0, left: 0, width: PIN_DESIGN_W, height: boardH,
            transform: `scale(${boardScale})`, transformOrigin: 'top left'
          }}>
          {items.map((im, i) => {
            const tilt = im.r;
            return (
              <div key={i} style={{
                position: 'absolute', left: `${im.l}%`, top: im.t,
                width: im.w, transform: `rotate(${tilt}deg)`,
                transformOrigin: '50% 0%'
              }}>
                {/* pin or tape */}
                {im.pin === 'pin' ? (
                  <div style={{
                    position: 'absolute', top: -9, left: '50%', zIndex: 3,
                    width: 18, height: 18, borderRadius: '50%',
                    transform: 'translateX(-50%)',
                    background: `radial-gradient(circle at 34% 30%, #fff 8%, ${PIN_COLORS[i % PIN_COLORS.length]} 52%, rgba(0,0,0,0.45) 130%)`,
                    boxShadow: '0 4px 7px rgba(0,0,0,0.4)'
                  }} />
                ) : (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', zIndex: 3,
                    width: 72, height: 24,
                    transform: `translateX(-50%) rotate(${-tilt * 1.6}deg)`,
                    background: TAPE_TINTS[i % TAPE_TINTS.length],
                    boxShadow: '0 2px 5px rgba(0,0,0,0.18)',
                    borderLeft: '1px solid rgba(255,255,255,0.25)',
                    borderRight: '1px solid rgba(0,0,0,0.06)'
                  }} />
                )}
                {/* photo card */}
                <div style={{
                  background: '#fffdf8', padding: '11px 11px 0',
                  boxShadow: '0 16px 30px rgba(46,37,34,0.28), 0 3px 6px rgba(46,37,34,0.14)'
                }}>
                  <div style={{
                    position: 'relative', width: '100%', height: picH[i] || im.h,
                    background: '#fffdf8', overflow: 'hidden'
                  }}>
                    <image-slot id={imgId(pageKey, s.id, `p${i}`)} placeholder="drop art"
                      fit="contain"
                      src={(s.imgs || [])[i] || undefined}
                      style={{ width: '100%', height: '100%', display: 'block' }} />
                    {edit &&
                    <button type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const slot = document.getElementById(imgId(pageKey, s.id, `p${i}`));
                        if (slot && slot.replace) slot.replace();
                      }}
                      style={{
                        position: 'absolute', top: 6, right: 6, zIndex: 4,
                        appearance: 'none', border: 0, borderRadius: 6,
                        padding: '5px 9px', cursor: 'pointer',
                        font: '600 11px/1 var(--font-ui), system-ui, sans-serif',
                        letterSpacing: '0.02em',
                        background: 'rgba(46,37,34,0.78)', color: '#fffdf8',
                        backdropFilter: 'blur(6px)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
                      }}>Replace</button>
                    }
                  </div>
                  <Editable tag="div" value={caps[i]} onCommit={(v) => setCap(i, v)}
                    placeholder="caption…"
                    style={{
                      fontFamily: '"Caveat", cursive', fontSize: 21, lineHeight: 1.15,
                      color: 'var(--ink-soft)', textAlign: 'center',
                      padding: '8px 4px 12px', minHeight: 20
                    }} />
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </section>);

}

// ─── CAROUSEL ─────────────────────────────────────────────────────────────
// One large image at a time with prev/next arrows + clickable dots.
// Slides are image-slot placeholders the user drops art into.
function CSCarousel({ s, ops }) {
  const { pageKey, edit } = React.useContext(EditCtx);
  const up = (patch) => ops.update(s.id, patch);
  const count = Math.max(1, Math.min(8, s.count || 5));
  const fit = s.fit === 'cover' ? 'cover' : 'contain';
  const ar = s.ar || '16 / 10';
  const [active, setActive] = React.useState(0);

  // Keep active index valid if slides are added/removed.
  React.useEffect(() => { if (active > count - 1) setActive(count - 1); }, [count, active]);

  const go = (dir) => setActive((a) => (a + dir + count) % count);
  const items = Array.from({ length: count });

  const arrowStyle = (side) => ({
    position: 'absolute', top: '50%', [side]: 14, zIndex: 4,
    transform: 'translateY(-50%)',
    width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: 'rgba(255,253,248,0.92)', color: 'var(--ink)',
    boxShadow: '0 10px 24px rgba(46,37,34,0.22), 0 2px 5px rgba(46,37,34,0.12)',
    fontSize: 22, lineHeight: 1, display: 'grid', placeItems: 'center',
    fontFamily: 'var(--font-ui)', transition: 'transform .18s ease, background .18s ease',
  });

  return (
    <section className="reveal" style={{ padding: '64px 0' }}>
      <div className="cs-wrap">
        {(edit || (s.eyebrow || s.heading)) &&
        <div style={{ marginBottom: 26 }}>
          <Editable tag="div" value={s.eyebrow} onCommit={(v) => up({ eyebrow: v })}
            placeholder="Eyebrow" className="type-eyebrow" style={{ marginBottom: 8 }} />
          <Editable tag="h2" value={s.heading} onCommit={(v) => up({ heading: v })}
            placeholder="Section heading…"
            style={{
              margin: 0, fontFamily: 'var(--font-headline)',
              fontVariationSettings: '"opsz" 144, "SOFT" 60, "wght" 600',
              fontSize: 'clamp(30px, 3.6vw, 48px)', lineHeight: 1.04,
              letterSpacing: '-0.02em', color: 'var(--ink)', textWrap: 'balance',
            }} />
        </div>
        }

        {edit &&
        <div contentEditable={false} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <ItemCtl label="slide"
            canRemove={count > 1}
            onAdd={() => up({ count: Math.min(8, count + 1) })}
            onRemove={() => up({ count: Math.max(1, count - 1) })} />
          <button className="cs-side-toggle" onClick={() => up({ fit: fit === 'cover' ? 'contain' : 'cover' })}>
            ⤢ fit: {fit}
          </button>
        </div>
        }

        <div style={{
          position: 'relative', width: '100%', aspectRatio: ar,
          maxWidth: s.maxW || 600, marginLeft: 'auto', marginRight: 'auto',
          background: 'var(--peach)', overflow: 'hidden', borderRadius: 12,
          boxShadow: '0 28px 50px rgba(46,37,34,0.16), 0 6px 12px rgba(46,37,34,0.08)',
        }}>
          {/* track */}
          <div style={{
            display: 'flex', height: '100%', width: `${count * 100}%`,
            transform: `translateX(-${active * (100 / count)}%)`,
            transition: 'transform .55s cubic-bezier(.4,.0,.2,1)',
          }}>
            {items.map((_, i) =>
            <div key={i} style={{ width: `${100 / count}%`, height: '100%', flex: '0 0 auto', position: 'relative' }}>
                <image-slot id={imgId(pageKey, s.id, `c${i}`)} placeholder={`image ${i + 1}`}
              src={(s.imgs || [])[i] || undefined} fit={fit}
              style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>
            )}
          </div>

          {count > 1 &&
          <>
            <button aria-label="Previous" style={arrowStyle('left')} onClick={() => go(-1)}>‹</button>
            <button aria-label="Next" style={arrowStyle('right')} onClick={() => go(1)}>›</button>
          </>
          }
        </div>

        {count > 1 &&
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 22 }}>
          {items.map((_, i) =>
          <button key={i} aria-label={`Go to slide ${i + 1}`} onClick={() => setActive(i)}
            style={{
              width: i === active ? 26 : 10, height: 10, borderRadius: 999, border: 'none',
              cursor: 'pointer', padding: 0,
              background: i === active ? 'var(--pink)' : 'rgba(46,37,34,0.22)',
              transition: 'width .3s ease, background .3s ease',
            }} />
          )}
        </div>
        }
      </div>
    </section>);

}

// ─── QUOTE ──────────────────────────────────────────────────────────────────
function CSQuote({ s, ops }) {
  const up = (patch) => ops.update(s.id, patch);
  return (
    <section className="reveal" style={{ padding: '64px 0', background: 'var(--peach)' }}>
      <div className="cs-wrap" style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-headline)',
          fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 700',
          fontSize: 160, lineHeight: 0.6, color: 'var(--pink)', marginBottom: 8, opacity: 0.35
        }}>“</div>
        <Editable tag="blockquote" value={s.text} onCommit={(v) => up({ text: v })}
        placeholder="The quote…"
        style={{
          margin: 0, fontFamily: 'var(--font-headline)',
          fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 500',
          fontStyle: 'italic', fontSize: 'clamp(30px, 4vw, 54px)', lineHeight: 1.15,
          letterSpacing: '-0.015em', color: 'var(--burgundy)',
          maxWidth: 980, marginLeft: 'auto', marginRight: 'auto', textWrap: 'balance'
        }} />
        <div style={{
          marginTop: 36, display: 'inline-flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ width: 36, height: 1, background: 'var(--ink-muted)' }} />
          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'baseline' }}>
            <Editable tag="span" value={s.author} onCommit={(v) => up({ author: v })}
            placeholder="Author"
            style={{
              fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink)'
            }} />
            <span style={{ color: 'var(--ink-muted)' }}>·</span>
            <Editable tag="span" value={s.role} onCommit={(v) => up({ role: v })}
            placeholder="Role"
            style={{
              fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-muted)'
            }} />
          </div>
          <div style={{ width: 36, height: 1, background: 'var(--ink-muted)' }} />
        </div>
      </div>
    </section>);

}

// ─── PROCESS ────────────────────────────────────────────────────────────────
function CSProcess({ s, ops }) {
  const steps = s.steps || [];
  const setStep = (i, patch) =>
  ops.update(s.id, { steps: steps.map((st, j) => j === i ? { ...st, ...patch } : st) });
  const addStep = () =>
  ops.update(s.id, { steps: [...steps, { title: 'New step', body: 'Describe this phase.' }] });
  const removeStep = () =>
  ops.update(s.id, { steps: steps.slice(0, -1) });
  return (
    <section className="reveal" style={{ padding: '64px 0' }}>
      <div className="cs-wrap">
        <div style={{ marginBottom: 60, maxWidth: 720 }}>
          <Editable tag="div" value={s.eyebrow} onCommit={(v) => ops.update(s.id, { eyebrow: v })}
          placeholder="Eyebrow" className="type-eyebrow" style={{ marginBottom: 18 }} />
          <Editable tag="h2" value={s.heading} onCommit={(v) => ops.update(s.id, { heading: v })}
          placeholder="Process heading"
          style={{
            margin: 0, fontFamily: 'var(--font-headline)',
            fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
            fontSize: 56, lineHeight: 1.02, letterSpacing: '-0.02em',
            color: 'var(--ink)', textWrap: 'balance'
          }} />
        </div>
        <ItemCtl label="step"
        canRemove={steps.length > 1}
        onAdd={addStep} onRemove={removeStep} />
        <div style={{ display: 'grid', gap: 8 }}>
          {steps.map((st, i) =>
          <div key={i} className="reveal cs-step" style={{
            display: 'grid', gridTemplateColumns: '120px 1fr', gap: 40, alignItems: 'start',
            padding: '38px 0', borderTop: '1px solid var(--border)'
          }}>
              <div style={{
              fontFamily: 'var(--font-headline)',
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
              fontSize: 84, lineHeight: 0.9, color: 'var(--orange)', letterSpacing: '-0.04em'
            }}>{st.num !== undefined ? st.num : String(i + 1).padStart(2, '0')}</div>
              <div>
                <Editable tag="h3" value={st.title} onCommit={(v) => setStep(i, { title: v })}
              placeholder="Step title"
              style={{
                margin: '0 0 10px', fontFamily: 'var(--font-headline)',
                fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
                fontSize: 30, lineHeight: 1.15, color: 'var(--ink)'
              }} />
                <Editable tag="p" value={st.body} onCommit={(v) => setStep(i, { body: v })}
              placeholder="Step description…"
              style={{
                margin: 0, fontFamily: 'var(--font-ui)', fontSize: 17, lineHeight: 1.65,
                color: 'var(--ink-soft)', maxWidth: 720, textWrap: 'pretty'
              }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>);

}

// ─── INSIGHTS (research cards) ────────────────────────────────────────────────
// Three (or more) cards, each a research insight: a finding, a representative
// quote, and an "Extension" note on why it matters. Each card has an
// image-slot for its supporting visual. Palette follows the portfolio
// (orange / cream / burgundy), not any reference deck.
function InsightMedia({ pageKey, sid, i, src }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const media = ref.current;
    if (!media) return;
    const slot = media.querySelector('image-slot');
    if (!slot) return;
    const apply = () => {
      const img = slot.shadowRoot && slot.shadowRoot.querySelector('.frame img');
      if (slot.hasAttribute('data-filled') && img && img.naturalWidth && img.naturalHeight) {
        media.style.aspectRatio = (img.naturalWidth / img.naturalHeight).toFixed(4);
      } else {
        media.style.aspectRatio = '';
      }
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(slot, { attributes: true, attributeFilter: ['data-filled'] });
    let n = 0,t = 0;
    const tick = () => {apply();if (n++ < 24) t = setTimeout(tick, 250);};
    tick();
    return () => {mo.disconnect();clearTimeout(t);};
  }, [pageKey, sid, i]);
  return (
    <div className="cs-insight-media" ref={ref}>
      <image-slot id={imgId(pageKey, sid, 'img' + i)} placeholder="drop insight visual"
      src={src || undefined} fit="contain"
      style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>);

}

function CSInsights({ s, ops }) {
  const { pageKey, edit } = React.useContext(EditCtx);
  const items = s.items || [];
  const up = (patch) => ops.update(s.id, patch);
  const setItem = (i, patch) =>
  up({ items: items.map((it, j) => j === i ? { ...it, ...patch } : it) });
  const addItem = () =>
  up({ items: [...items, { title: 'New insight', body: 'What we found.', quote: '', quoteBy: '', extension: '' }] });
  const removeItem = () => up({ items: items.slice(0, -1) });

  const clean = (v) => v && String(v).replace(/<[^>]*>/g, '').trim();
  const hasHead = clean(s.eyebrow) || clean(s.heading);

  return (
    <section className="reveal" style={{ padding: '64px 0' }}>
      <div className="cs-wrap">
        {(edit || hasHead) &&
        <div style={{ marginBottom: 52, maxWidth: 760 }}>
            <Editable tag="div" value={s.eyebrow} onCommit={(v) => up({ eyebrow: v })}
          placeholder="Eyebrow" className="type-eyebrow" style={{ marginBottom: 18 }} />
            <Editable tag="h2" value={s.heading} onCommit={(v) => up({ heading: v })}
          placeholder="Section heading"
          style={{
            margin: 0, fontFamily: 'var(--font-headline)',
            fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
            fontSize: 48, lineHeight: 1.04, letterSpacing: '-0.02em',
            color: 'var(--ink)', textWrap: 'balance'
          }} />
          </div>
        }
        <ItemCtl label="insight"
        canRemove={items.length > 1}
        onAdd={addItem} onRemove={removeItem} />
        <div className="cs-insights-grid">
          {items.map((it, i) =>
          <article key={i} className="reveal cs-insight-card">
              <InsightMedia pageKey={pageKey} sid={s.id} i={i} src={it.img} />
              <div className="cs-insight-body">
                <div className="cs-insight-num">{String(i + 1).padStart(2, '0')}</div>
                <Editable tag="h3" value={it.title} onCommit={(v) => setItem(i, { title: v })}
              placeholder="Insight title" className="cs-insight-title" />
                <Editable tag="p" value={it.body} onCommit={(v) => setItem(i, { body: v })}
              placeholder="What we found…" className="cs-insight-text" />
                {(edit || clean(it.quote)) &&
              <blockquote className="cs-insight-quote">
                    <Editable tag="p" value={it.quote} onCommit={(v) => setItem(i, { quote: v })}
                placeholder="A representative quote…" className="cs-insight-qtext" />
                    {(edit || clean(it.quoteBy)) &&
                <Editable tag="span" value={it.quoteBy} onCommit={(v) => setItem(i, { quoteBy: v })}
                placeholder="Who said it" className="cs-insight-qby" />
                }
                  </blockquote>
              }
                {(edit || clean(it.extension)) &&
              <div className="cs-insight-ext">
                    <div className="cs-insight-ext-label">Extension</div>
                    <Editable tag="p" value={it.extension} onCommit={(v) => setItem(i, { extension: v })}
                placeholder="Why it matters…" className="cs-insight-text" />
                  </div>
              }
              </div>
            </article>
          )}
        </div>
      </div>
    </section>);

}

// ─── BOUNCING QUOTES (lives inside the metrics section) ──────────────────────
// Playful testimonial cards that bounce in when scrolled to, then bob gently.
// Plus a small circular photo placeholder for the person being quoted.
function CSBounceQuotes({ s, up, edit, pageKey, active }) {
  const quotes = s.quotes || [];
  const setQuote = (i, v) => up({ quotes: quotes.map((q, j) => j === i ? { ...q, text: v } : q) });
  const addQuote = () => up({ quotes: [...quotes, { text: 'A new quote…' }] });
  const removeQuote = () => up({ quotes: quotes.slice(0, -1) });
  const picRef = React.useRef(null);
  // Size the slot to the dropped image's true ratio (no crop, no letterbox).
  React.useEffect(() => {
    const slot = document.getElementById(imgId(pageKey, s.id, 'qpic2'));
    const wrap = picRef.current;
    if (!slot || !wrap) return;
    const apply = () => {
      const img = slot.shadowRoot && slot.shadowRoot.querySelector('.frame img');
      if (img && img.naturalWidth && img.naturalHeight && slot.hasAttribute('data-filled')) {
        wrap.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
      } else {
        wrap.style.aspectRatio = '4 / 5';
      }
    };
    apply();
    const img = slot.shadowRoot && slot.shadowRoot.querySelector('.frame img');
    if (img) img.addEventListener('load', apply);
    const mo = new MutationObserver(apply);
    mo.observe(slot, { attributes: true, attributeFilter: ['data-filled', 'src'] });
    return () => { if (img) img.removeEventListener('load', apply); mo.disconnect(); };
  }, [pageKey, s.id, s.quotesPic]);
  // Promote a dropped photo to a real value so it also shows in preview.
  React.useEffect(() => {
    const slot = document.getElementById(imgId(pageKey, s.id, 'qpic2'));
    if (!slot) return;
    const sync = () => { if (slot.hasAttribute('data-filled') && !s.quotesPic) up({ quotesPic: true }); };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(slot, { attributes: true, attributeFilter: ['data-filled'] });
    return () => mo.disconnect();
  }, [pageKey, s.id, s.quotesPic]);
  if (!edit && !quotes.length) return null;
  const introBlank = !String(s.quotesIntro || '').replace(/<[^>]*>/g, '').trim();
  const subBlank = !String(s.quotesSub || '').replace(/<[^>]*>/g, '').trim();
  const capBlank = !String(s.quotesPicCap || '').replace(/<[^>]*>/g, '').trim();
  return (
    <div className={`cs-bquotes${(active || edit) ? ' in' : ''}`}>
      {(edit || !introBlank) &&
      <Editable tag="div" value={s.quotesIntro} onCommit={(v) => up({ quotesIntro: v })}
      placeholder="Intro line above the quotes…" className="cs-bquotes-intro" />
      }
      {(edit || !subBlank) &&
      <Editable tag="div" value={s.quotesSub} onCommit={(v) => up({ quotesSub: v })}
      placeholder="Small label…" className="cs-bquotes-sub" />
      }
      <div className="cs-bquotes-grid">
        {quotes.map((q, i) =>
        <div className="cs-bquote-wrap" key={i}>
            <blockquote className="cs-bquote">
              <Editable tag="p" value={q.text} onCommit={(v) => setQuote(i, v)}
            placeholder="Quote…" className="cs-bquote-text" />
            </blockquote>
          </div>
        )}
      </div>
      {(edit || s.quotesPic) &&
      <div className="cs-bquote-pic-wrap">
          <div className="cs-bquote-pic-bob">
            <div className="cs-bquote-pic-pop" ref={picRef} style={{ width: '100%', maxWidth: 360, aspectRatio: '4 / 5', borderRadius: 20, overflow: 'hidden', margin: '0 auto' }}>
              <image-slot id={imgId(pageKey, s.id, 'qpic2')} placeholder="drop product shot"
            src={s.quotesPic && s.quotesPic !== true ? s.quotesPic : 'images/tempo-product.png'} fit="contain"
            style={{ display: 'block', width: '100%', height: '100%', '--slot-frame-bg': 'transparent' }} />
            </div>
          </div>
          {(edit || !capBlank) &&
        <Editable tag="div" value={s.quotesPicCap} onCommit={(v) => up({ quotesPicCap: v })}
          placeholder="Caption…" className="cs-bquote-pic-cap" />
        }
        </div>
      }
      {edit &&
      <ItemCtl label="quote" canRemove={quotes.length > 1} onAdd={addQuote} onRemove={removeQuote} />
      }
    </div>);

}

// ─── METRICS ────────────────────────────────────────────────────────────────
function CSMetrics({ s, ops }) {
  // Renders in the same animated-number "outcome" style used across every
  // project (matches the AtlasOne numbers), while keeping the metrics data
  // shape ({ value, label } + optional eyebrow / note).
  const { edit, pageKey } = React.useContext(EditCtx);
  const up = (patch) => ops.update(s.id, patch);
  const items = s.items || [];
  const setItem = (i, patch) =>
  up({ items: items.map((it, j) => j === i ? { ...it, ...patch } : it) });
  const addItem = () =>
  up({ items: [...items, { value: '00', label: 'What this measures' }] });
  const removeItem = () => up({ items: items.slice(0, -1) });

  const rootRef = React.useRef(null);
  const heroWrapRef = React.useRef(null);
  // Size the header image to its dropped image's true ratio (no crop, no letterbox).
  React.useEffect(() => {
    if (!s.headerImg) return;
    const slot = document.getElementById(imgId(pageKey, s.id, 'hero'));
    const wrap = heroWrapRef.current;
    if (!slot || !slot.shadowRoot || !wrap) return;
    const img = slot.shadowRoot.querySelector('.frame img');
    if (!img) return;
    const apply = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (w && h && slot.hasAttribute('data-filled')) wrap.style.aspectRatio = w + ' / ' + h;
      else wrap.style.aspectRatio = '16 / 9';
    };
    apply();
    img.addEventListener('load', apply);
    const mo = new MutationObserver(apply);
    mo.observe(slot, { attributes: true, attributeFilter: ['data-filled'] });
    return () => { img.removeEventListener('load', apply); mo.disconnect(); };
  }, [pageKey, s.id, s.headerImg]);
  // If the user drops an image into the (edit-only) hero slot, promote it to
  // a real header so it also shows in preview — no separate toggle needed.
  React.useEffect(() => {
    const slot = document.getElementById(imgId(pageKey, s.id, 'hero'));
    if (!slot) return;
    const sync = () => { if (slot.hasAttribute('data-filled') && !s.headerImg) up({ headerImg: true }); };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(slot, { attributes: true, attributeFilter: ['data-filled'] });
    return () => mo.disconnect();
  }, [pageKey, s.id, s.headerImg]);
  const [shown, setShown] = React.useState(false);
  const [editingIdx, setEditingIdx] = React.useState(-1);
  // Animate count-up on scroll-in, in both edit and preview.
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) {setShown(true);return;}
    const check = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.85 && r.bottom > 0) {setShown(true);return true;}
      return false;
    };
    if (check()) return;
    let io;
    const cleanup = () => {
      if (io) io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    const onScroll = () => {if (check()) cleanup();};
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => {
        es.forEach((e) => {if (e.isIntersecting) {setShown(true);cleanup();}});
      }, { threshold: 0.25 });
      io.observe(el);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return cleanup;
  }, []);

  const hasEyebrow = s.eyebrow && s.eyebrow.replace(/<[^>]*>/g, '').trim();
  const hasHeading = s.heading && s.heading.replace(/<[^>]*>/g, '').trim();
  const hasNote = s.note && s.note.replace(/<[^>]*>/g, '').trim();
  const cols = Math.min(Math.max(items.length, 1), 4);
  return (
    <section className="reveal" style={{ padding: '64px 0' }}>
      <div className="cs-wrap" ref={rootRef}>
        {(edit || hasEyebrow) &&
        <Editable tag="div" value={s.eyebrow} onCommit={(v) => up({ eyebrow: v })}
        placeholder="Eyebrow"
        style={{
          fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700,
          letterSpacing: '0.24em', textTransform: 'uppercase',
          color: 'var(--pink)', textAlign: 'center', marginBottom: 18
        }} />
        }
        {(edit || hasHeading) &&
        <Editable tag="h2" value={s.heading} onCommit={(v) => up({ heading: v })}
        placeholder="Results heading" className="cs-outcome-head" />
        }
        {!s.hideHeader && (edit || s.headerImg) &&
        <div ref={heroWrapRef} style={{ margin: '34px auto 4px', maxWidth: 860, width: '100%', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden' }}>
            <image-slot id={imgId(pageKey, s.id, 'hero')} placeholder="drop image"
          src={s.headerImg && s.headerImg !== true ? s.headerImg : undefined} fit="contain"
          style={{ display: 'block', width: '100%', height: '100%', '--slot-frame-bg': '#fff' }} />
          </div>
        }
        <CSBounceQuotes s={s} up={up} edit={edit} pageKey={pageKey} active={shown} />
        <ItemCtl label="metric"
        canRemove={items.length > 1}
        onAdd={addItem} onRemove={removeItem} />
        <div className="cs-outcome-grid" style={{ '--cols': cols }}>
          {items.map((m, i) =>
          <div key={i} className={`cs-outcome-item${shown ? ' pop' : ''}`}
          style={{ animationDelay: `${i * 130}ms` }}>
              {edit && editingIdx !== i ?
            <div onClick={() => setEditingIdx(i)} style={{ cursor: 'text' }}
            title="Click to edit">
                  <CSOutcomeNum value={m.value} active={shown} delay={i * 130} />
                </div> :
            edit ?
            <Editable tag="div" value={m.value}
            onCommit={(v) => {setItem(i, { value: v });setEditingIdx(-1);}}
            placeholder="00%" className="cs-outcome-num" /> :

            <CSOutcomeNum value={m.value} active={shown} delay={i * 130} />
            }
              <p className="cs-outcome-cap">
                {edit || m.body && String(m.body).replace(/<[^>]*>/g, '').trim() ?
              <>
                    <Editable tag="span" value={m.label} onCommit={(v) => setItem(i, { label: v })}
                placeholder="Result label:" className="cs-outcome-lbl" />
                    <span> </span>
                    <Editable tag="span" value={m.body} onCommit={(v) => setItem(i, { body: v })}
                placeholder="A short description of this outcome." />
                  </> :

              <Editable tag="span" value={m.label} onCommit={(v) => setItem(i, { label: v })}
              placeholder="What this measures" />
              }
              </p>
            </div>
          )}
        </div>
        {(edit || hasNote) &&
        <Editable tag="div" value={s.note} onCommit={(v) => up({ note: v })}
        placeholder="Optional note…"
        style={{
          margin: '56px auto 0', fontFamily: 'var(--font-script)', fontSize: 22,
          color: 'var(--orange)', opacity: 0.8, textAlign: 'center'
        }} />
        }
      </div>
    </section>);

}

// ─── OUTCOME (animated numbers) ───────────────────────────────────────────────
// Big numbers that pop in and count up when scrolled into view. Matches a
// light editorial "results" layout: centred italic heading, periwinkle figures,
// a bold lead-in + description under each.
function parseStat(str) {
  const s = String(str == null ? '' : str).
  replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '').trim();
  const m = s.match(/^([^\d-]*-?)([\d,]*\.?\d+)(.*)$/);
  if (!m) return { num: NaN, raw: s };
  const numStr = m[2];
  return {
    prefix: m[1], suffix: m[3], raw: s,
    num: parseFloat(numStr.replace(/,/g, '')),
    decimals: (numStr.split('.')[1] || '').length,
    comma: numStr.includes(',') || parseFloat(numStr.replace(/,/g, '')) >= 1000
  };
}
function fmtStat(v, p) {
  if (isNaN(p.num)) return p.raw;
  let n = p.decimals ? v.toFixed(p.decimals) : String(Math.round(v));
  if (p.comma) {
    const parts = n.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    n = parts.join('.');
  }
  return (p.prefix || '') + n + (p.suffix || '');
}
function CSOutcomeNum({ value, active, delay = 0 }) {
  const p = React.useMemo(() => parseStat(value), [value]);
  const reduce = typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [disp, setDisp] = React.useState(() => active && !reduce && !isNaN(p.num) ? fmtStat(0, p) : p.raw);
  React.useEffect(() => {
    if (!active || reduce || isNaN(p.num)) {setDisp(p.raw);return;}
    let raf = 0,start = 0;
    const dur = 1400;
    const tick = (t) => {
      if (!start) start = t + delay;
      if (t < start) {raf = requestAnimationFrame(tick);return;}
      const prog = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - prog, 3);
      setDisp(prog >= 1 ? p.raw : fmtStat(p.num * eased, p));
      if (prog < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value]); // eslint-disable-line
  return <div className="cs-outcome-num">{disp}</div>;
}
function CSOutcome({ s, ops }) {
  const { edit } = React.useContext(EditCtx);
  const up = (patch) => ops.update(s.id, patch);
  const items = s.items || [];
  const setItem = (i, patch) =>
  up({ items: items.map((it, j) => j === i ? { ...it, ...patch } : it) });
  const addItem = () =>
  up({ items: [...items, { value: '00', label: 'New result', body: 'Describe the outcome.' }] });
  const removeItem = () => up({ items: items.slice(0, -1) });

  const rootRef = React.useRef(null);
  const [shown, setShown] = React.useState(false);
  const [editingIdx, setEditingIdx] = React.useState(-1);
  // Animate on scroll-in in BOTH edit and preview, so the count-up is visible
  // while authoring too. In edit mode the number stays click-to-edit.
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) {setShown(true);return;}
    const check = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.85 && r.bottom > 0) {setShown(true);return true;}
      return false;
    };
    if (check()) return;
    let io;
    const cleanup = () => {
      if (io) io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    const onScroll = () => {if (check()) cleanup();};
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => {
        es.forEach((e) => {if (e.isIntersecting) {setShown(true);cleanup();}});
      }, { threshold: 0.25 });
      io.observe(el);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return cleanup;
  }, []);

  const cols = Math.min(Math.max(items.length, 1), 4);
  return (
    <section className="reveal" style={{ padding: '64px 0' }}>
      <div className="cs-wrap" ref={rootRef}>
        {(edit || s.heading && s.heading.replace(/<[^>]*>/g, '').trim()) &&
        <Editable tag="h2" value={s.heading} onCommit={(v) => up({ heading: v })}
        placeholder="The Outcome" className="cs-outcome-head" />
        }
        <ItemCtl label="result"
        canRemove={items.length > 1}
        onAdd={addItem} onRemove={removeItem} />
        <div className="cs-outcome-grid" style={{ '--cols': cols }}>
          {items.map((m, i) =>
          <div key={i} className={`cs-outcome-item${shown ? ' pop' : ''}`}
          style={{ animationDelay: `${i * 130}ms` }}>
              {edit && editingIdx !== i ?
            <div onClick={() => setEditingIdx(i)} style={{ cursor: 'text' }}
            title="Click to edit">
                  <CSOutcomeNum value={m.value} active={shown} delay={i * 130} />
                </div> :
            edit ?
            <Editable tag="div" value={m.value}
            onCommit={(v) => {setItem(i, { value: v });setEditingIdx(-1);}}
            placeholder="50%" className="cs-outcome-num" /> :

            <CSOutcomeNum value={m.value} active={shown} delay={i * 130} />
            }
              <p className="cs-outcome-cap">
                <Editable tag="span" value={m.label} onCommit={(v) => setItem(i, { label: v })}
              placeholder="Result label:" className="cs-outcome-lbl" />
                <span> </span>
                <Editable tag="span" value={m.body} onCommit={(v) => setItem(i, { body: v })}
              placeholder="A short description of this outcome." />
              </p>
            </div>
          )}
        </div>
      </div>
    </section>);

}

// ─── NEXT PROJECT ─────────────────────────────────────────────────────────────
function CSNext({ next, update }) {
  const { pageKey, edit } = React.useContext(EditCtx);
  return (
    <section className="reveal" style={{ padding: '64px 0' }}>
      <div className="cs-wrap">
        <a href={edit ? undefined : next.href} className="cs-next" style={{
          display: 'grid', gridTemplateColumns: '1fr 220px', gap: 56, alignItems: 'center',
          textDecoration: 'none', color: 'inherit', padding: '40px 0',
          borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)'
        }}>
          <div>
            <Editable tag="div" value={next.label} onCommit={(v) => update({ label: v })}
            placeholder="Next Project"
            style={{
              fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.24em', textTransform: 'uppercase',
              color: 'var(--pink)', marginBottom: 18
            }} />
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 24 }}>
              <Editable tag="h2" value={next.title} onCommit={(v) => update({ title: v })}
              placeholder="Project name"
              style={{
                margin: 0, fontFamily: 'var(--font-headline)',
                fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 700',
                fontSize: 'clamp(48px, 6.5vw, 92px)', lineHeight: 0.95,
                letterSpacing: '-0.025em', color: 'var(--orange)'
              }} />
              <span style={{ fontSize: '0.5em', color: 'var(--ink)' }}>→</span>
            </div>
            {edit &&
            <div className="cs-video-input" contentEditable={false} style={{ marginTop: 18 }}>
                <span className="cs-field-label">Links to</span>
                <input type="text" defaultValue={next.href}
              placeholder="case-study-two.html"
              onBlur={(e) => update({ href: e.target.value })} />
              </div>
            }
          </div>
          <div style={{
            width: 220, height: 160, background: 'var(--peach)', overflow: 'hidden',
            transform: 'rotate(2deg)', boxShadow: '0 16px 30px rgba(46,37,34,0.16)'
          }}>
            <image-slot id={imgId(pageKey, 'next', 'img')} placeholder="image"
            src={next.img || undefined}
            style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </a>
      </div>
    </section>);

}

// ─── PRIORITIES · MoSCoW chart ─────────────────────────────────────────────
// A full-width "objective + priorities" block: a short objective statement on
// top, then three columns (Must / Should / Nice to have), each a list of items
// with a small line icon. Replaces the cramped image+text objective layout.
const PR_ICONS = {
  ai: <g><rect x="7.5" y="7.5" width="9" height="9" rx="1.6" /><path d="M10 4.5v3M14 4.5v3M10 16.5v3M14 16.5v3M4.5 10h3M4.5 14h3M16.5 10h3M16.5 14h3" /><rect x="10.6" y="10.6" width="2.8" height="2.8" rx="0.4" /></g>,
  flow: <g><path d="M5 9.5a7 7 0 0 1 11.5-3.2" /><polyline points="16.8 3.4 16.8 6.4 13.8 6.4" /><path d="M19 14.5a7 7 0 0 1-11.5 3.2" /><polyline points="7.2 20.6 7.2 17.6 10.2 17.6" /></g>,
  mind: <g><path d="M12 6.2a4 4 0 0 0-2.6 7.04V16h5.2v-2.76A4 4 0 0 0 12 6.2Z" /><path d="M9.6 18.4h4.8" /><path d="M10.2 13.4h3.6" /></g>,
  guest: <g><circle cx="12" cy="8.4" r="3.1" /><path d="M6.3 18.6a5.7 5.7 0 0 1 11.4 0" /></g>,
  profit: <g><polyline points="4.5 15.5 9.5 10.5 12.5 13.5 19.5 6.5" /><polyline points="15 6.5 19.5 6.5 19.5 11" /><path d="M4.5 19.5h15" /></g>,
  review: <g><path d="M4.5 5.5h15v9h-9l-3.6 3v-3h-2.4z" /><path d="M8 9h8M8 11.6h5" /></g>,
  smile: <g><circle cx="12" cy="12" r="7.5" /><circle cx="9.4" cy="10.2" r="0.9" fill="currentColor" stroke="none" /><circle cx="14.6" cy="10.2" r="0.9" fill="currentColor" stroke="none" /><path d="M8.6 13.8a4 4 0 0 0 6.8 0" /></g>,
  chart: <g><path d="M4.5 19.5h15" /><rect x="6" y="13" width="3" height="6.5" rx="0.5" /><rect x="10.5" y="9" width="3" height="10.5" rx="0.5" /><rect x="15" y="5.5" width="3" height="14" rx="0.5" /></g>,
  star: <path d="M12 4 13.88 9.41 19.61 9.53 15.04 12.99 16.7 18.47 12 15.2 7.3 18.47 8.96 12.99 4.39 9.53 10.12 9.41Z" />,
  gauge: <g><path d="M5.5 16.5a6.5 6.5 0 0 1 13 0" /><path d="M12 16.5l3.5-3.5" /><circle cx="12" cy="16.5" r="1.1" fill="currentColor" stroke="none" /></g>
};
function PrIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PR_ICONS[name] || <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />}
    </svg>);

}

function CSPriorities({ s, ops }) {
  const { edit, pageKey } = React.useContext(EditCtx);
  const up = (patch) => ops.update(s.id, patch);
  const groups = s.groups || [];
  const accents = ['var(--burgundy)', 'var(--orange)', 'var(--pink)'];

  const editGroups = (mut) => {
    const next = groups.map((g) => ({ ...g, items: g.items.map((it) => ({ ...it })) }));
    mut(next);
    up({ groups: next });
  };
  const setTier = (gi, v) => editGroups((g) => {g[gi].tier = v;});
  const setItem = (gi, ii, v) => editGroups((g) => {g[gi].items[ii].label = v;});
  const addItem = (gi) => editGroups((g) => {g[gi].items.push({ icon: 'dot', label: 'New item' });});
  const removeItem = (gi, ii) => editGroups((g) => {g[gi].items.splice(ii, 1);});

  return (
    <section className="reveal" style={{ padding: '64px 0' }}>
      <div className="cs-wrap">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 40, marginBottom: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
        <Editable tag="div" value={s.eyebrow} onCommit={(v) => up({ eyebrow: v })}
        placeholder="The approach"
        style={{
          fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700,
          letterSpacing: '0.24em', textTransform: 'uppercase',
          color: 'var(--pink)', marginBottom: 18
        }} />
        <Editable tag="h2" value={s.heading} onCommit={(v) => up({ heading: v })}
        placeholder="Project Objective"
        style={{
          margin: 0, fontFamily: 'var(--font-headline)',
          fontVariationSettings: '"opsz" 144, "SOFT" 60, "wght" 600',
          fontSize: 'clamp(34px, 4.4vw, 54px)', lineHeight: 1.02,
          letterSpacing: '-0.02em', color: 'var(--ink)'
        }} />
        <Editable tag="p" value={s.lead} onCommit={(v) => up({ lead: v })}
        placeholder="A one-line objective for the project…"
        style={{
          margin: '18px 0 0', maxWidth: 760, fontFamily: 'var(--font-ui)',
          fontSize: 'clamp(17px, 1.7vw, 21px)', lineHeight: 1.5, color: 'var(--ink-soft)'
        }} />
          </div>
          <div style={{ flex: '0 0 auto', width: 220, aspectRatio: '4/3', borderRadius: 14, overflow: 'hidden' }}>
            <image-slot id={imgId(pageKey, s.id, 'hero')} placeholder="objective image"
              fit="cover" style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </div>

        <div style={{
          marginTop: 52, display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'clamp(28px, 4vw, 64px)'
        }}>
          {groups.map((g, gi) => {
            const color = accents[gi % accents.length];
            return (
              <div key={gi}>
                <div style={{ borderTop: `2px solid ${color}`, paddingTop: 14, marginBottom: 8 }}>
                  <Editable tag="div" value={g.tier} onCommit={(v) => setTier(gi, v)}
                  placeholder="Tier"
                  style={{
                    fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 18,
                    letterSpacing: '0.01em', color: 'var(--ink)'
                  }} />
                </div>
                <div>
                  {g.items.map((it, ii) =>
                  <div key={ii} className="cs-pr-item" style={{
                    display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 0',
                    borderBottom: '1px solid var(--border)'
                  }}>
                      <span className="cs-pr-icon" style={{
                      flex: '0 0 auto', color,
                      width: 46, height: 46, borderRadius: '50%',
                      display: 'grid', placeItems: 'center',
                      background: `color-mix(in oklab, ${color} 13%, transparent)`,
                      animationDelay: `calc(${gi} * 0.14s + ${ii} * 0.1s)`
                    }}><PrIcon name={it.icon} /></span>
                      <Editable tag="div" value={it.label} onCommit={(v) => setItem(gi, ii, v)}
                    placeholder="Item"
                    style={{
                      flex: 1, fontFamily: 'var(--font-ui)', fontSize: 16.5,
                      lineHeight: 1.38, color: 'var(--ink-soft)', alignSelf: 'center'
                    }} />
                      {edit &&
                    <button className="cs-pr-x" contentEditable={false}
                    onClick={() => removeItem(gi, ii)} title="Remove"
                    style={{
                      flex: '0 0 auto', appearance: 'none', border: 0, background: 'transparent',
                      color: 'var(--ink-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1,
                      padding: '2px 4px'
                    }}>×</button>
                    }
                    </div>
                  )}
                  {edit &&
                  <button className="cs-pr-add" contentEditable={false} onClick={() => addItem(gi)}
                  style={{
                    marginTop: 12, appearance: 'none', border: '1px dashed var(--border)',
                    background: 'transparent', color: 'var(--ink-muted)', cursor: 'pointer',
                    fontFamily: 'var(--font-ui)', fontSize: 13, borderRadius: 8, padding: '6px 12px'
                  }}>+ add item</button>
                  }
                </div>
              </div>);

          })}
        </div>
      </div>
    </section>);

}

// ─── INSIGHT CARDS · image-on-top cards ─────────────────────────────────────
function CSInsightCards({ s, ops }) {
  const { pageKey, edit } = React.useContext(EditCtx);
  const cards = s.cards || [];
  const accents = ['var(--orange)', 'var(--pink)', 'var(--burgundy)'];
  const editCards = (mut) => {
    const next = cards.map((c) => ({ ...c }));
    mut(next);
    ops.update(s.id, { cards: next });
  };
  const setCard = (i, patch) => editCards((c) => {c[i] = { ...c[i], ...patch };});
  const addCard = () => editCards((c) => {
    c.push({ eyebrow: 'Insight ' + (c.length + 1), title: 'New insight',
      body: 'Describe the insight.', extension: 'Why it matters.' });
  });
  const removeCard = (i) => editCards((c) => {c.splice(i, 1);});

  return (
    <section className="reveal" style={{ padding: '64px 0' }}>
      <div className="cs-wrap">
        {(s.eyebrow || edit) &&
        <Editable tag="div" value={s.eyebrow} onCommit={(v) => ops.update(s.id, { eyebrow: v })}
        placeholder="Primary Research" className="type-eyebrow" style={{ marginBottom: 16 }} />
        }
        {(s.heading || edit) &&
        <Editable tag="h2" value={s.heading} onCommit={(v) => ops.update(s.id, { heading: v })}
        placeholder="Key insights"
        style={{
          margin: '0 0 44px', fontFamily: 'var(--font-headline)',
          fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
          fontSize: 'clamp(34px, 4.2vw, 54px)', lineHeight: 1.02,
          letterSpacing: '-0.02em', color: 'var(--ink)', textWrap: 'balance'
        }} />
        }
        <ItemCtl label="card"
        canRemove={cards.length > 1}
        onAdd={addCard} onRemove={() => removeCard(cards.length - 1)} />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(20px, 2.4vw, 32px)', alignItems: 'stretch'
        }}>
          {cards.map((c, i) => {
            const color = accents[i % accents.length];
            return (
              <article key={i} className="reveal cs-removable" style={{
                position: 'relative', background: 'var(--card)', borderRadius: 16,
                overflow: 'hidden', border: '1px solid var(--border)',
                boxShadow: '0 20px 44px rgba(46,37,34,0.10), 0 3px 8px rgba(46,37,34,0.05)',
                display: 'flex', flexDirection: 'column'
              }}>
                {edit && cards.length > 1 &&
                <button className="cs-remove-x" contentEditable={false}
                onClick={() => removeCard(i)} title="Remove card">×</button>
                }
                <div style={{
                  width: '100%', aspectRatio: '4 / 3', background: 'var(--peach)',
                  borderBottom: `3px solid ${color}`
                }}>
                  <image-slot id={imgId(pageKey, s.id, 'c' + i)} placeholder="drop image"
                  src={c.img || undefined} fit="contain"
                  style={{ width: '100%', height: '100%', display: 'block' }} />
                </div>
                <div style={{ padding: '22px 24px 26px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                  <Editable tag="div" value={c.eyebrow} onCommit={(v) => setCard(i, { eyebrow: v })}
                  placeholder={'Insight ' + (i + 1)}
                  style={{
                    fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12,
                    letterSpacing: '0.16em', textTransform: 'uppercase', color
                  }} />
                  <Editable tag="h3" value={c.title} onCommit={(v) => setCard(i, { title: v })}
                  placeholder="Insight title"
                  style={{
                    margin: 0, fontFamily: 'var(--font-headline)',
                    fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
                    fontSize: 'clamp(22px, 2vw, 27px)', lineHeight: 1.1,
                    letterSpacing: '-0.01em', color: 'var(--ink)'
                  }} />
                  <Editable tag="p" value={c.body} onCommit={(v) => setCard(i, { body: v })}
                  placeholder="Insight detail…"
                  style={{
                    margin: 0, fontFamily: 'var(--font-ui)', fontSize: 15.5,
                    lineHeight: 1.5, color: 'var(--ink-soft)'
                  }} />
                  {(c.extension || edit) &&
                  <div style={{ marginTop: 4, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                      <div style={{
                      fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11,
                      letterSpacing: '0.14em', textTransform: 'uppercase',
                      marginBottom: 6, color: "rgb(231, 70, 39)"
                    }}>Extension</div>
                      <Editable tag="p" value={c.extension} onCommit={(v) => setCard(i, { extension: v })}
                    placeholder="Why it matters…"
                    style={{
                      margin: 0, fontFamily: 'var(--font-ui)', fontSize: 14.5,
                      lineHeight: 1.5, color: 'var(--ink-soft)'
                    }} />
                    </div>
                  }
                </div>
              </article>);

          })}
        </div>
      </div>
    </section>);

}

// ─── CONCEPT CARDS · image + text + external PDF button ─────────────────────
function CSConceptCards({ s, ops }) {
  const { pageKey, edit } = React.useContext(EditCtx);
  const cards = s.cards || [];
  const accents = ['var(--orange)', 'var(--pink)', 'var(--burgundy)'];
  const editCards = (mut) => {
    const next = cards.map((c) => ({ ...c }));
    mut(next);
    ops.update(s.id, { cards: next });
  };
  const setCard = (i, patch) => editCards((c) => {c[i] = { ...c[i], ...patch };});
  const addCard = () => editCards((c) => {
    c.push({ eyebrow: 'Concept ' + (c.length + 1), title: 'New concept',
      body: 'Describe the concept.', pdf: '', btn: 'View PDF' });
  });
  const removeCard = (i) => editCards((c) => {c.splice(i, 1);});

  // Size each image placeholder to its dropped image's natural ratio (no letterbox).
  React.useEffect(() => {
    const cleanups = [];
    cards.forEach((c, i) => {
      const slot = document.getElementById(imgId(pageKey, s.id, 'c' + i + '-img'));
      if (!slot || !slot.shadowRoot) return;
      const img = slot.shadowRoot.querySelector('.frame img');
      if (!img) return;
      const apply = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        if (w && h && slot.hasAttribute('data-filled')) slot.style.aspectRatio = w + ' / ' + h;
        else slot.style.aspectRatio = '4 / 3';
      };
      apply();
      img.addEventListener('load', apply);
      const mo = new MutationObserver(apply);
      mo.observe(slot, { attributes: true, attributeFilter: ['data-filled'] });
      cleanups.push(() => { img.removeEventListener('load', apply); mo.disconnect(); });
    });
    return () => cleanups.forEach((fn) => fn());
  }, [cards, pageKey, s.id]);

  return (
    <section className="reveal" style={{ padding: '64px 0' }}>
      <div className="cs-wrap">
        {(s.eyebrow || edit) &&
        <Editable tag="div" value={s.eyebrow} onCommit={(v) => ops.update(s.id, { eyebrow: v })}
        placeholder="Concepts" className="type-eyebrow" style={{ marginBottom: 16 }} />
        }
        {(s.heading || edit) &&
        <Editable tag="h2" value={s.heading} onCommit={(v) => ops.update(s.id, { heading: v })}
        placeholder="Three directions"
        style={{
          margin: '0 0 44px', fontFamily: 'var(--font-headline)',
          fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
          fontSize: 'clamp(34px, 4.2vw, 54px)', lineHeight: 1.02,
          letterSpacing: '-0.02em', color: 'var(--ink)', textWrap: 'balance'
        }} />
        }
        <ItemCtl label="concept"
        canRemove={cards.length > 1}
        onAdd={addCard} onRemove={() => removeCard(cards.length - 1)} />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'clamp(20px, 2.4vw, 32px)', alignItems: 'stretch'
        }}>
          {cards.map((c, i) => {
            const color = accents[i % accents.length];
            return (
              <article key={i} className="reveal cs-removable" style={{
                position: 'relative', background: 'var(--card)', borderRadius: 16,
                overflow: 'hidden', border: '1px solid var(--border)',
                boxShadow: '0 20px 44px rgba(46,37,34,0.10), 0 3px 8px rgba(46,37,34,0.05)',
                display: 'flex', flexDirection: 'column'
              }}>
                {edit && cards.length > 1 &&
                <button className="cs-remove-x" contentEditable={false}
                onClick={() => removeCard(i)} title="Remove concept">×</button>
                }
                <div style={{
                  width: '100%', aspectRatio: '3 / 2', background: 'var(--peach)',
                  borderBottom: `3px solid ${color}`
                }}>
                  <image-slot id={imgId(pageKey, s.id, 'c' + i)} placeholder="drop concept sketch"
                  src={c.img || undefined} fit="contain"
                  style={{ width: '100%', height: '100%', display: 'block' }} />
                </div>
                <div style={{ padding: '22px 24px 26px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  <Editable tag="div" value={c.eyebrow} onCommit={(v) => setCard(i, { eyebrow: v })}
                  placeholder={'Concept ' + (i + 1)}
                  style={{
                    fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12,
                    letterSpacing: '0.16em', textTransform: 'uppercase', color
                  }} />
                  <Editable tag="h3" value={c.title} onCommit={(v) => setCard(i, { title: v })}
                  placeholder="Concept title"
                  style={{
                    margin: 0, fontFamily: 'var(--font-headline)',
                    fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
                    fontSize: 'clamp(22px, 2vw, 27px)', lineHeight: 1.1,
                    letterSpacing: '-0.01em', color: 'var(--ink)'
                  }} />
                  <Editable tag="p" value={c.body} onCommit={(v) => setCard(i, { body: v })}
                  placeholder="Concept detail…"
                  style={{
                    margin: 0, fontFamily: 'var(--font-ui)', fontSize: 15.5,
                    lineHeight: 1.5, color: 'var(--ink-soft)', flex: 1
                  }} />
                  <div style={{ marginTop: 8 }}>
                    <image-slot id={imgId(pageKey, s.id, 'c' + i + '-img')} placeholder="drop image"
                    src={c.img2 || undefined} fit="contain"
                    style={{
                      display: 'block', width: '100%', aspectRatio: '4 / 3',
                      borderRadius: 10, overflow: 'hidden',
                      border: `1px solid var(--border)`, background: '#fff',
                      '--slot-frame-bg': '#fff'
                    }} />
                  </div>
                </div>
              </article>);

          })}
        </div>
      </div>
    </section>);

}

// ─── FEATURE SHOWCASE · app screens (top) + hardware (bottom), pop-in ───────
function CSFeatureShowcase({ s, ops }) {
  const { pageKey, edit } = React.useContext(EditCtx);
  const up = (patch) => ops.update(s.id, patch);
  const apps = s.apps || [];
  const hw = s.hw || [];
  const editList = (keyName, mut) => {
    const next = (s[keyName] || []).map((x) => ({ ...x }));
    mut(next);
    up({ [keyName]: next });
  };
  const setApp = (i, patch) => editList('apps', (a) => {a[i] = { ...a[i], ...patch };});
  const setHw = (i, patch) => editList('hw', (a) => {a[i] = { ...a[i], ...patch };});
  const addApp = () => editList('apps', (a) => a.push({ label: 'New feature' }));
  const removeApp = (i) => editList('apps', (a) => a.splice(i, 1));
  const addHw = () => editList('hw', (a) => a.push({ name: 'TempoX', body: 'Describe it.' }));
  const removeHw = (i) => editList('hw', (a) => a.splice(i, 1));

  return (
    <section className="reveal" style={{ padding: '64px 0' }}>
      <div className="cs-wrap">
        <Editable tag="h2" value={s.heading} onCommit={(v) => up({ heading: v })}
        placeholder="Tempo’s Features"
        style={{
          textAlign: 'center', margin: '0 0 56px', fontFamily: 'var(--font-headline)',
          fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600', fontStyle: 'italic',
          fontSize: 'clamp(34px, 4.6vw, 56px)', color: 'var(--burgundy)', letterSpacing: '-0.01em'
        }} />

        {/* top row — app screens */}
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${Math.min(apps.length || 1, 3)}, 1fr)`,
          gap: 'clamp(24px, 3vw, 48px)', marginBottom: 'clamp(48px, 6vw, 96px)'
        }}>
          {apps.map((a, i) =>
          <div key={i} className="reveal cs-feature-pop cs-removable" style={{
            position: 'relative', display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', transitionDelay: `calc(${i} * 0.08s)`
          }}>
              {edit && apps.length > 1 &&
            <button className="cs-remove-x" contentEditable={false}
            onClick={() => removeApp(i)} title="Remove">×</button>
            }
              <div style={{ width: '70%', maxWidth: 240, aspectRatio: '3 / 4', marginBottom: 22 }}>
                <image-slot id={imgId(pageKey, s.id, 'app' + i)} placeholder="app screen"
              src={a.img || undefined} fit="contain"
              style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>
              <Editable tag="div" value={a.label} onCommit={(v) => setApp(i, { label: v })}
            placeholder="Feature name"
            style={{
              fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 17,
              lineHeight: 1.3, color: 'var(--ink)', maxWidth: 260
            }} />
            </div>
          )}
        </div>
        {edit &&
        <div style={{ marginBottom: 56 }}>
            <ItemCtl label="app feature" canRemove={apps.length > 1}
          onAdd={addApp} onRemove={() => removeApp(apps.length - 1)} />
          </div>
        }

        {/* bottom row — hardware */}
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${Math.min(hw.length || 1, 3)}, 1fr)`,
          gap: 'clamp(28px, 3.5vw, 56px)'
        }}>
          {hw.map((h, i) =>
          <div key={i} className="reveal cs-feature-pop cs-removable" style={{
            position: 'relative', display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', transitionDelay: `calc(${i} * 0.08s)`
          }}>
              {edit && hw.length > 1 &&
            <button className="cs-remove-x" contentEditable={false}
            onClick={() => removeHw(i)} title="Remove">×</button>
            }
              <div className="cs-feature-circle" style={{
              width: 'min(230px, 70%)', aspectRatio: '1 / 1', borderRadius: '18px',
              background: 'color-mix(in oklab, var(--lavender) 42%, white)',
              display: 'grid', placeItems: 'center', marginBottom: 22, overflow: 'hidden'
            }}>
                <image-slot id={imgId(pageKey, s.id, 'hw' + i)} placeholder="hardware"
              src={h.img || undefined} fit="contain"
              style={{ width: '90%', height: '90%', display: 'block' }} />
              </div>
              <Editable tag="h3" value={h.name} onCommit={(v) => setHw(i, { name: v })}
            placeholder="TempoX"
            style={{
              margin: '0 0 10px', fontFamily: 'var(--font-headline)',
              fontVariationSettings: '"opsz" 144, "SOFT" 80, "wght" 600',
              fontSize: 24, color: 'var(--burgundy)'
            }} />
              <Editable tag="p" value={h.body} onCommit={(v) => setHw(i, { body: v })}
            placeholder="Description…"
            style={{
              margin: 0, maxWidth: 290, fontFamily: 'var(--font-ui)', fontSize: 15,
              lineHeight: 1.55, color: 'var(--ink-soft)'
            }} />
            </div>
          )}
        </div>
        {edit &&
        <div style={{ marginTop: 40 }}>
            <ItemCtl label="hardware feature" canRemove={hw.length > 1}
          onAdd={addHw} onRemove={() => removeHw(hw.length - 1)} />
          </div>
        }
      </div>
    </section>);

}

// ─── PROCESS FLOW ───────────────────────────────────────────────────────────
// A horizontal step-by-step flow with a two-phase platform rail beneath
// (e.g. Salesforce → AtlasOne). Replaces flat exported diagram screenshots
// with crisp, on-brand, editable vector steps.
//   s.steps : [{ t:'label', phase:'sf'|'atlas' }]
//   s.phaseA / s.phaseB : rail labels (default 'Salesforce' / 'AtlasOne')
//   s.caption : script caption beneath
function CSProcessFlow({ s, ops }) {
  const { edit } = React.useContext(EditCtx);
  const up = (patch) => ops.update(s.id, patch);
  const steps = s.steps || [];
  const phaseA = s.phaseA || 'Salesforce';
  const phaseB = s.phaseB || 'AtlasOne';
  const aCount = steps.filter((x) => (x.phase || 'sf') !== 'atlas').length;
  const bCount = steps.length - aCount;

  const setStep = (i, patch) =>
    up({ steps: steps.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const addStep = () => up({ steps: [...steps, { t: 'New step', phase: 'sf' }] });
  const removeStep = () => up({ steps: steps.slice(0, -1) });

  const Chevron = ({ accent }) => (
    <div aria-hidden="true" style={{
      flex: '0 0 auto', alignSelf: 'center',
      display: 'flex', alignItems: 'center', padding: '0 2px',
      color: accent ? 'var(--orange)' : 'var(--ink-muted)'
    }}>
      <svg width={accent ? 30 : 24} height="34" viewBox="0 0 26 34" fill="none">
        <path d="M5 5 L19 17 L5 29" stroke="currentColor" strokeWidth={accent ? 3.4 : 2.6}
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  return (
    <section className="reveal" style={{ padding: s.tight ? '24px 0' : '48px 0' }}>
      <div className="cs-wrap">
        {(edit || s.title) &&
          <Editable tag="h3" value={s.title} onCommit={(v) => up({ title: v })}
            placeholder="Add a title above this flow…"
            style={{
              margin: '0 0 26px', fontFamily: 'var(--font-headline)',
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
              fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.015em', color: 'var(--ink)'
            }} />
        }

        {edit &&
          <div contentEditable={false} style={{ marginBottom: 18 }}>
            <ItemCtl label="step" canRemove={steps.length > 2}
              onAdd={addStep} onRemove={removeStep} />
          </div>
        }

        <div className="cs-flow-scroll" style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ minWidth: steps.length > 6 ? steps.length * 128 : 'auto' }}>
            {/* step chips */}
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              {steps.map((st, i) => {
                const atlas = (st.phase || 'sf') === 'atlas';
                const handoff = i > 0 && atlas && (steps[i - 1].phase || 'sf') !== 'atlas';
                return (
                  <React.Fragment key={i}>
                    {i > 0 && <Chevron accent={handoff} />}
                    <div
                      onClick={edit ? () => setStep(i, { phase: atlas ? 'sf' : 'atlas' }) : undefined}
                      title={edit ? 'Click to toggle Salesforce / AtlasOne phase' : undefined}
                      className="cs-flow-chip"
                      style={{
                        flex: '1 1 0', minWidth: 112,
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        background: atlas ? 'var(--orange)' : '#fff',
                        border: `1.5px solid ${atlas ? 'var(--orange)' : 'var(--border)'}`,
                        borderRadius: 16, padding: '16px 13px 14px',
                        cursor: edit ? 'pointer' : 'default',
                        boxShadow: atlas
                          ? '0 14px 26px rgba(230,62,30,0.20), 0 2px 5px rgba(230,62,30,0.16)'
                          : '0 10px 22px rgba(46,37,34,0.07), 0 2px 4px rgba(46,37,34,0.04)'
                      }}>
                      <div style={{
                        fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 12,
                        letterSpacing: '0.12em', marginBottom: 8,
                        color: atlas ? '#FFD9CF' : 'var(--pink)'
                      }}>{String(i + 1).padStart(2, '0')}</div>
                      <Editable tag="div" value={st.t}
                        onCommit={(v) => setStep(i, { t: v })}
                        placeholder="Step…"
                        style={{
                          fontFamily: 'var(--font-headline)',
                          fontVariationSettings: '"opsz" 40, "SOFT" 0, "wght" 560',
                          fontSize: 15.5, lineHeight: 1.16, letterSpacing: '-0.01em',
                          overflowWrap: 'break-word', hyphens: 'auto', textWrap: 'pretty',
                          color: atlas ? '#fff' : 'var(--ink)'
                        }} />
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* platform rail */}
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              {aCount > 0 &&
                <div style={{
                  flex: aCount, display: 'flex', alignItems: 'center', gap: 11,
                  padding: '12px 22px', borderRadius: 13, background: 'var(--peach)'
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', flex: '0 0 auto', background: 'var(--ink-muted)' }} />
                  <span style={{
                    fontFamily: 'var(--font-headline)', fontVariationSettings: '"opsz" 80, "wght" 600',
                    fontSize: 17, color: 'var(--ink)'
                  }}>{phaseA}</span>
                </div>
              }
              {bCount > 0 &&
                <div style={{
                  flex: bCount, display: 'flex', alignItems: 'center', gap: 11,
                  padding: '12px 22px', borderRadius: 13,
                  background: 'rgba(230,62,30,0.10)', border: '1px solid rgba(230,62,30,0.22)'
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', flex: '0 0 auto', background: 'var(--orange)' }} />
                  <span style={{
                    fontFamily: 'var(--font-headline)', fontVariationSettings: '"opsz" 80, "wght" 600',
                    fontSize: 17, color: 'var(--orange)'
                  }}>{phaseB}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <Editable tag="div" value={s.caption} onCommit={(v) => up({ caption: v })}
          placeholder="Add a caption…"
          style={{ marginTop: 18, fontFamily: 'var(--font-script)', fontSize: s.captionSize || 20, color: 'var(--ink-muted)' }} />
      </div>
    </section>);
}

// ─── BRANCH FLOW ─────────────────────────────────────────────────────────────
// A clean decision flowchart: an intake card, a decision diamond, and two
// labelled branches of pill-nodes (with small notes). Replaces a flat
// exported flowchart screenshot with crisp, on-brand, editable vector nodes.
function CSBFNode({ node, accent, onCommit, big }) {
  return (
    <div style={{
      position: 'relative', background: accent ? 'var(--peach)' : '#fff',
      border: `1.5px solid ${accent ? 'rgba(230,62,30,0.28)' : 'var(--border)'}`,
      borderRadius: 14, padding: big ? '14px 18px' : '12px 16px',
      minWidth: 132, textAlign: 'center',
      boxShadow: '0 8px 18px rgba(46,37,34,0.06), 0 2px 4px rgba(46,37,34,0.04)'
    }}>
      <Editable tag="div" value={node.t} onCommit={(v) => onCommit({ t: v })}
        placeholder="Node…"
        style={{
          fontFamily: 'var(--font-headline)', fontVariationSettings: '"opsz" 60, "wght" 600',
          fontSize: 16, lineHeight: 1.16, color: 'var(--ink)'
        }} />
      {(node.sub || node.t != null) &&
        <Editable tag="div" value={node.sub} onCommit={(v) => onCommit({ sub: v })}
          placeholder=""
          style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--ink-muted)', marginTop: node.sub ? 3 : 0 }} />
      }
    </div>);
}

const BF_ARROW = (
  <div aria-hidden="true" style={{ flex: '0 0 auto', alignSelf: 'center', color: 'var(--ink-muted)', display: 'flex', padding: '0 2px' }}>
    <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
      <path d="M4 4 L15 13 L4 22" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

function CSBranchFlow({ s, ops }) {
  const { edit } = React.useContext(EditCtx);
  const up = (patch) => ops.update(s.id, patch);
  const intake = s.intake || {};
  const branches = s.branches || [];
  const setBranchNode = (bi, ni, patch) => up({
    branches: branches.map((b, j) => j !== bi ? b : { ...b, nodes: b.nodes.map((n, k) => k === ni ? { ...n, ...patch } : n) })
  });

  const Note = ({ value, onCommit }) => (
    <Editable tag="div" value={value} onCommit={onCommit} placeholder="note…"
      style={{ maxWidth: 200, marginTop: 8, fontFamily: 'var(--font-ui)', fontSize: 12.5, lineHeight: 1.45, color: 'var(--ink-soft)', textWrap: 'pretty' }} />
  );

  return (
    <section className="reveal" style={{ padding: s.tight ? '24px 0' : '48px 0' }}>
      <div className="cs-wrap">
        {(edit || s.title) &&
          <Editable tag="h3" value={s.title} onCommit={(v) => up({ title: v })}
            placeholder="Add a title above this flow…"
            style={{
              margin: '0 0 28px', fontFamily: 'var(--font-headline)',
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
              fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.015em', color: 'var(--ink)'
            }} />
        }

        <div className="cs-branchflow" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 22 }}>
          {/* intake card */}
          <div style={{
            flex: '0 1 320px', background: 'color-mix(in oklab, var(--lavender) 26%, white)',
            border: '1.5px solid color-mix(in oklab, var(--lavender) 55%, var(--border))',
            borderRadius: 18, padding: '20px 22px'
          }}>
            <Editable tag="div" value={intake.title} onCommit={(v) => up({ intake: { ...intake, title: v } })}
              placeholder="Intake title…"
              style={{ fontFamily: 'var(--font-headline)', fontVariationSettings: '"opsz" 80, "wght" 600', fontSize: 18, color: 'var(--burgundy)', marginBottom: 14 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {(intake.steps || []).map((st, i) =>
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ flex: '0 0 auto', marginTop: 7, width: 6, height: 6, borderRadius: '50%', background: 'var(--lavender)' }} />
                  <Editable tag="div" value={st}
                    onCommit={(v) => up({ intake: { ...intake, steps: intake.steps.map((x, j) => j === i ? v : x) } })}
                    placeholder="Step…"
                    style={{ fontFamily: 'var(--font-ui)', fontSize: 14, lineHeight: 1.4, color: 'var(--ink-soft)' }} />
                </div>
              )}
            </div>
          </div>

          {BF_ARROW}

          {/* decision diamond */}
          <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 138, height: 138, display: 'grid', placeItems: 'center', textAlign: 'center',
              transform: 'rotate(45deg)', borderRadius: 18,
              background: '#fff', border: '2px solid var(--pink)',
              boxShadow: '0 12px 26px rgba(230,51,107,0.16)'
            }}>
              <div style={{ transform: 'rotate(-45deg)', padding: '0 6px' }}>
                <Editable tag="div" value={s.decision} onCommit={(v) => up({ decision: v })}
                  placeholder="Decision?"
                  style={{ fontFamily: 'var(--font-headline)', fontVariationSettings: '"opsz" 60, "wght" 600', fontSize: 15, lineHeight: 1.1, color: 'var(--pink)' }} />
              </div>
            </div>
          </div>

          {/* branches */}
          <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: 22, minWidth: 320 }}>
            {branches.map((b, bi) => {
              const accent = bi === 0;
              return (
                <div key={bi} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    flex: '0 0 auto', marginTop: 12, padding: '4px 13px', borderRadius: 999,
                    fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                    background: accent ? 'rgba(230,62,30,0.12)' : 'var(--peach)',
                    color: accent ? 'var(--orange)' : 'var(--ink)'
                  }}>
                    <Editable tag="span" value={b.label} onCommit={(v) => up({ branches: branches.map((x, j) => j === bi ? { ...x, label: v } : x) })} placeholder="?" style={{ display: 'inline' }} />
                  </span>
                  {(b.nodes || []).map((n, ni) =>
                    <React.Fragment key={ni}>
                      {ni > 0 && BF_ARROW}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 210 }}>
                        <CSBFNode node={n} accent={accent} onCommit={(patch) => setBranchNode(bi, ni, patch)} />
                        {(n.note != null || edit) && <Note value={n.note} onCommit={(v) => setBranchNode(bi, ni, { note: v })} />}
                      </div>
                    </React.Fragment>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* aside offshoot */}
        {(s.aside || edit) &&
          <div style={{
            marginTop: 30, maxWidth: 560, padding: '16px 20px', borderRadius: 14,
            background: 'var(--peach)', borderLeft: '3px solid var(--orange)'
          }}>
            <Editable tag="div" value={(s.aside || {}).title} onCommit={(v) => up({ aside: { ...(s.aside || {}), title: v } })}
              placeholder="Side path…"
              style={{ fontFamily: 'var(--font-headline)', fontVariationSettings: '"opsz" 60, "wght" 600', fontSize: 16, color: 'var(--ink)' }} />
            <Editable tag="div" value={(s.aside || {}).note} onCommit={(v) => up({ aside: { ...(s.aside || {}), note: v } })}
              placeholder="note…"
              style={{ marginTop: 6, fontFamily: 'var(--font-ui)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-soft)' }} />
          </div>
        }

        {(s.footnote || edit) &&
          <Editable tag="div" value={s.footnote} onCommit={(v) => up({ footnote: v })}
            placeholder="Footnote…"
            style={{ marginTop: 18, fontFamily: 'var(--font-ui)', fontSize: 13, fontStyle: 'italic', color: 'var(--ink-muted)' }} />
        }

        <Editable tag="div" value={s.caption} onCommit={(v) => up({ caption: v })}
          placeholder="Add a caption…"
          style={{ marginTop: 16, fontFamily: 'var(--font-script)', fontSize: s.captionSize || 20, color: 'var(--ink-muted)' }} />
      </div>
    </section>);
}

Object.assign(window, {
  useParallax, ItemCtl,
  CSHero, CSMeta, CSIntro, CSGate, CSFullImage, CSImageText,
  CSGallery, CSCarousel, CSQuote, CSProcess, CSInsights, CSMetrics, CSOutcome, CSNext, CSPriorities, CSInsightCards, CSConceptCards, CSFeatureShowcase,
  CSProcessFlow, CSBranchFlow
});