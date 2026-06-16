// about.jsx — About Me page, rebuilt to match the editorial homepage system
// (Fraunces + Plus Jakarta · cream/peach/burgundy/pink · SiteNav · Footer ·
//  .btn · scroll-reveal). Bio text + carousel captions are click-to-edit and
// persist in the browser. Photos are drag-drop image slots.

// ┌──────────────────────────────────────────────────────────────────────┐
// │  RESUME LINK — paste your Google Doc share link between the quotes.    │
// │  (Set the doc to "Anyone with the link can view" so it opens for all.) │
// └──────────────────────────────────────────────────────────────────────┘
const RESUME_URL = "https://docs.google.com/document/d/REPLACE_WITH_YOUR_DOC_ID/edit?usp=sharing";

// ─── inline editable text (uncontrolled; persists to localStorage) ─────────
function EditableText({ storeKey, defaultHtml = '', tag = 'div', placeholder, style, className = '' }) {
  const edit = React.useContext(window.PageEditCtx || React.createContext(true));
  const ref = React.useRef(null);
  const Tag = tag;
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const raw = localStorage.getItem('about:' + storeKey);
    let val = raw != null ? raw : defaultHtml;
    const stripped = val.replace(/^[\u201c\u201d"']([\s\S]*?)[\u201c\u201d"']$/, '$1').trim();
    if (stripped !== val) { val = stripped; localStorage.setItem('about:' + storeKey, val); }
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
    onPaste={(e) => {
      // Paste as PLAIN TEXT so copied content always adopts this field's
      // preset font, size and line-height instead of the source's styling.
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      const ok = document.execCommand && document.execCommand('insertText', false, text);
      if (!ok) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          sel.deleteFromDocument();
          sel.getRangeAt(0).insertNode(document.createTextNode(text));
          sel.collapseToEnd();
        }
      }
    }}
    onBlur={(e) => localStorage.setItem('about:' + storeKey, e.currentTarget.innerHTML)}
    style={style} />);

}

// ─── scroll reveal ─────────────────────────────────────────────────────────
function useReveal() {
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const vh = () => window.innerHeight || 800;
    document.querySelectorAll('.reveal').forEach((el) => {
      if (el.getBoundingClientRect().top > vh() - 80) el.setAttribute('data-reveal-pending', '');
    });
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {e.target.removeAttribute('data-reveal-pending');io.unobserve(e.target);}
      }), { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal[data-reveal-pending]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ─── photo board (about me — scrapbook / bulletin board) ───────────────────
// Photos are pinned to a cork board as polaroids: white frame, handwritten
// caption, a tilt, and a pushpin or strip of washi tape. Hover straightens &
// lifts the frame. Image-slot ids are unchanged so any dropped photos persist.
const FRAMES = [
{ id: 'about-carousel-1', cap: 'studio days — cold brew, warm light.', rot: -5, hold: { type: 'pin', color: C.pink } },
{ id: 'about-carousel-2', cap: 'sketchbook spread, mid-idea.', rot: 3.5, hold: { type: 'tape', color: C.orange } },
{ id: 'about-carousel-3', cap: 'riso prints drying on the line.', rot: -2.5, hold: { type: 'pin', color: C.lavender } },
{ id: 'about-carousel-4', cap: 'somewhere green, off the clock.', rot: 4, hold: { type: 'tape', color: C.pink } },
{ id: 'about-carousel-5', cap: 'the desk, on a good day.', rot: -3.5, hold: { type: 'pin', color: C.orange } }];


// A single pushpin (geometric — dome + needle + highlight).
function Pushpin({ color = C.pink, style }) {
  return (
    <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', zIndex: 6, pointerEvents: 'none', ...style }}>
      <svg width="28" height="34" viewBox="0 0 28 34" style={{ filter: 'drop-shadow(0 4px 4px rgba(40,28,16,0.35))' }}>
        <rect x="12.4" y="13" width="3.2" height="18" rx="1.6" fill="#8c8278" />
        <ellipse cx="14" cy="11" rx="11" ry="10" fill={color} />
        <ellipse cx="14" cy="11" rx="11" ry="10" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
        <ellipse cx="10" cy="7.5" rx="3.4" ry="2.6" fill="#fff" opacity="0.55" />
      </svg>
    </div>);

}

function PhotoBoard() {
  const { removed, remove, restoreAll, count } = useRemovable('about-carousel');
  const live = FRAMES.filter((s) => !removed.has(s.id));

  return (
    <div style={{ position: 'relative', maxWidth: 1060, margin: '0 auto' }}>
      {/* soft scrapbook board — cream linen, on-brand (no brown) */}
      <div style={{
        position: 'relative', padding: '60px 44px 66px', borderRadius: 8,
        background: 'var(--peach)',
        backgroundImage:
        'radial-gradient(rgba(230,51,107,0.10) 1.2px, transparent 1.5px),' +
        'radial-gradient(rgba(196,181,224,0.18) 1px, transparent 1.3px)',
        backgroundSize: '16px 16px, 11px 11px',
        backgroundPosition: '0 0, 8px 9px',
        border: '12px solid #fff',
        boxShadow: '0 0 0 1px var(--border) inset, 0 30px 60px rgba(46,37,34,0.16), 0 6px 12px rgba(46,37,34,0.08)'
      }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
          alignItems: 'flex-start', gap: '46px 54px'
        }}>
          {live.length === 0 &&
          <div style={{
            fontFamily: 'var(--font-script)', fontSize: 28, color: 'var(--ink-soft)',
            padding: '40px 0'
          }}>Nothing pinned up yet — drop a few photos!</div>
          }
          {live.map((s, i) =>
          <div key={s.id} className="cs-removable board-pola"
          style={{
            '--rot': s.rot + 'deg', position: 'relative', width: 228,
            background: '#fdfaf2', padding: '13px 13px 0',
            boxShadow: '0 14px 28px rgba(40,28,16,0.34), 0 3px 6px rgba(40,28,16,0.18)',
            marginTop: i % 2 ? 30 : 0
          }}>
              <DeleteDot onDelete={() => remove(s.id)} label="photo" style={{ top: 20, right: 16, zIndex: 7 }} />
              {s.hold.type === 'pin' ?
            <Pushpin color={s.hold.color} /> :
            <Tape color={s.hold.color} w={104} h={24} rotate={s.rot * -1.3 - 3} pattern="stripe"
            peelable={false} style={{ top: -11, left: '50%', marginLeft: -52, zIndex: 6 }} />
            }
              <div style={{
              width: '100%', aspectRatio: '1 / 1', background: '#e7dfcb', overflow: 'hidden'
            }}>
                <image-slot id={s.id} placeholder="drop a photo"
              style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>
              <EditableText key={s.id + '-cap'} storeKey={'cap-' + s.id}
            defaultHtml={s.cap} placeholder="caption…"
            style={{
              fontFamily: 'var(--font-script)', fontSize: 21, lineHeight: 1.12,
              color: C.inkSoft, textAlign: 'center', padding: '11px 6px 16px', textWrap: 'balance'
            }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
        <RestoreChip count={count} onRestore={restoreAll} style={{ margin: 0 }} />
      </div>
    </div>);

}

// ─── section heading helper (editable) ─────────────────────────────────────
function SectionHead({ eyebrowKey, eyebrow, headKey, head, align = 'left', color = 'var(--ink)' }) {
  return (
    <div className="reveal" style={{ textAlign: align, marginBottom: 44 }}>
      <EditableText storeKey={eyebrowKey} defaultHtml={eyebrow} placeholder="eyebrow"
      className="type-eyebrow" style={{ marginBottom: 16, color: 'var(--pink)' }} />
      <EditableText storeKey={headKey} tag="h2" defaultHtml={head} placeholder="Heading"
      style={{
        margin: 0, fontFamily: 'var(--font-headline)',
        fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
        fontSize: 52, lineHeight: 1.02, letterSpacing: '-0.02em', color, textWrap: 'balance'
      }} />
    </div>);

}

// ─── experience rows ───────────────────────────────────────────────────────
const EXPERIENCE = [
{ year: '2025 — present', role: 'GlobusMedical', sub: 'E- Learning Designer', note: 'FDA-compliant sales training for 1,500+ global reps in Articulate Storyline 360, plus LMS operations across six departments.' },
{ year: '2024', role: 'Party City', sub: 'Learning Experience Designer', note: '10+ interactive onboarding modules built with ADDIE & SAM — cutting new-hire onboarding time by 30%.' },
{ year: '2024', role: 'Linkt', sub: 'UX / Web Design Intern', note: 'Redesigned site visuals for AI-product clarity and built wireframes in Figma & Miro to streamline project workflows.' },
{ year: '2023 — 24', role: 'Georgia Tech', sub: 'Learning Assistant', note: 'Mentored 50+ industrial design students on 3D modeling and design workflows.' },
{ year: '2023', role: 'Cascades', sub: 'Industrial Design Intern', note: 'Refined 40+ sustainable packaging concepts through sketches and 3D visualization in ArtiosCAD.' },
{ year: 'education', role: 'BS, Industrial Design', sub: 'Georgia Tech', note: 'GPA 3.84 · 2020–2024' }];


// ─── page ───────────────────────────────────────────────────────────────────
function AboutPage() {
  const [edit, setEdit] = React.useState(() => {
    if (!window.siteCanEdit()) return false;
    const v = localStorage.getItem('about:edit');
    return v === null ? true : v === '1';
  });
  React.useEffect(() => {
    localStorage.setItem('about:edit', edit ? '1' : '0');
    document.body.classList.toggle('cs-editing', edit);
  }, [edit]);

  useReveal();
  const facts = useRemovable('about-facts');
  const exp = useRemovable('about-exp');
  return (
    <window.PageEditCtx.Provider value={edit}>
    <div style={{ maxWidth: 1280, width: '100%', position: 'relative', background: C.bg, margin: '0 auto', minHeight: '100vh' }}>
      <SiteNav active="about" />
      {window.siteCanEdit() &&
      <PageEditToolbar edit={edit} setEdit={setEdit} pageKey="about"
        extraPrefixes={['about:', 'rm:about-', 'cap-about-carousel']} />
      }

      {/* ── HERO / INTRO ── */}
      <section className="about-hero-section" style={{ position: 'relative', padding: '40px 100px 60px', color: "rgb(0, 0, 0)" }}>
        <div className="cs-it-grid" style={{
          display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 72, alignItems: 'center'
        }}>
          {/* Left: intro + bio */}
          <div className="reveal from-left">
            <EditableText storeKey="hero-script" tag="div" placeholder="intro line"
            defaultHtml="Heyy, I&rsquo;m Pri!"
            className="type-script hero-script"
            style={{ fontSize: 46, color: C.pink, transform: 'rotate(-2deg)', display: 'inline-block', marginBottom: 6 }} />
            <EditableText storeKey="bio" tag="div"
            placeholder="Write a little about yourself…"
            defaultHtml={
            "I&rsquo;ve loved design for as long as I can remember&mdash;I was the kid painting on the walls and sitting outside for hours sketching whatever caught my eye. That curiosity eventually led me to study <strong style=\"color:var(--orange);font-family:inherit\">Industrial Design at Georgia Tech</strong>, where I learned how to turn ideas into thoughtful, intentional design.<br><br>" +
            "After graduating, I worked at <strong style=\"color:var(--pink);font-family:inherit\">Party City Headquarters</strong> on the Learning &amp; Development team, designing interactive onboarding and training experiences that helped employees learn faster and feel more confident in their roles. Today, I bring those same skills to <strong style=\"color:var(--burgundy);font-family:inherit\">Globus Medical</strong>, where I design digital learning experiences that translate complex medical product information into clear, engaging training.<br><br>" +
            "I&rsquo;m passionate about <strong style=\"color:var(--orange);font-family:inherit\">using design to make complicated ideas easier to understand</strong>, and I&rsquo;m excited to explore new opportunities where I can continue growing, collaborating, and creating meaningful work."
            }
            style={{
              fontFamily: 'var(--font-ui)', fontSize: 19, lineHeight: 1.68,
              color: C.inkSoft, maxWidth: 540, textWrap: 'pretty'
            }} />
          </div>

          {/* Right: portrait */}
          <div className="reveal from-right" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="about-portrait-wrap" style={{ position: 'relative', width: 320 }}>
              <div className="about-portrait-box" style={{
                width: 320, height: 400, background: C.softPink,
                borderRadius: '160px 160px 16px 16px', overflow: 'hidden',
                boxShadow: '0 28px 50px rgba(46,37,34,0.16)'
              }}>
                <image-slot id="about-portrait" placeholder="your portrait"
                style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>
              <EditableText storeKey="portrait-cap" tag="div" placeholder="caption"
              defaultHtml="this is me :)"
              className="type-script"
              style={{
                position: 'absolute', right: -10, bottom: -18, fontSize: 30, color: 'rgb(230, 62, 30)', transform: 'rotate(-4deg)'
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK FACTS ── */}
      <section className="about-facts-section" style={{ position: 'relative', padding: '80px 100px 40px' }}>
        {(() => {
          const FACTS = [
          ['based in', 'New York'],
          ['works on', 'Onboarding · brand · UX'],
          ['tools', 'Figma · AI · Riso'],
          ['likes', 'Chai · riso · plants']];

          const liveCount = FACTS.filter((_, k) => !facts.removed.has('f' + k)).length;
          return (
            <React.Fragment>
              <div className="reveal cs-facts-row about-facts-grid" style={{
                display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, liveCount)}, auto)`,
                justifyContent: 'space-between', gap: 40,
                borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '34px 0'
              }}>
                {FACTS.map(([label, val], k) =>
                facts.removed.has('f' + k) ? null :
                <Removable key={k} onDelete={() => facts.remove('f' + k)} label="fact">
                      <EditableText storeKey={'factlabel-' + k} defaultHtml={label} placeholder="label"
                  className="type-eyebrow" style={{ color: C.pink, marginBottom: 10 }} />
                      <EditableText storeKey={'fact-' + k} defaultHtml={val} placeholder="…"
                  style={{
                    fontFamily: 'var(--font-headline)',
                    fontVariationSettings: '"opsz" 144, "SOFT" 50, "wght" 500',
                    fontSize: 22, lineHeight: 1.2, color: C.ink, whiteSpace: 'nowrap'
                  }} />
                    </Removable>

                )}
              </div>
              {facts.count > 0 &&
              <div style={{ marginTop: 16 }}>
                  <RestoreChip count={facts.count} onRestore={facts.restoreAll} />
                </div>
              }
            </React.Fragment>);

        })()}
      </section>

      {/* ── RESUME / EXPERIENCE ── */}
      <section id="resume" className="about-resume-section" style={{ position: 'relative', padding: '80px 100px 90px', scrollMarginTop: 90 }}>
        <SectionHead eyebrowKey="res-eyebrow" eyebrow="resume · experience"
        headKey="res-head" head="Where I&rsquo;ve been." />

        <div style={{ display: 'grid', gap: 4 }}>
          {EXPERIENCE.map((e, k) =>
          exp.removed.has('x' + k) ? null :
          <div key={k} className="reveal cs-removable about-exp-row" style={{
            display: 'grid', gridTemplateColumns: '200px 1fr', gap: 40, alignItems: 'baseline',
            padding: '30px 0', borderTop: '1px solid var(--border)', position: 'relative'
          }}>
              <DeleteDot onDelete={() => exp.remove('x' + k)} label="role" style={{ top: 22, right: 0 }} />
              <EditableText storeKey={'exp-year-' + k} defaultHtml={e.year} placeholder="year"
            style={{
              fontFamily: 'var(--font-headline)',
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
              fontSize: 28, lineHeight: 1, color: C.orange, letterSpacing: '-0.01em'
            }} />
              <div>
                <div style={{
                fontFamily: 'var(--font-headline)',
                fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
                fontSize: 26, color: C.ink,
                display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8
              }}>
                  <EditableText storeKey={'exp-role-' + k} tag="span" defaultHtml={e.role} placeholder="role" />
                  {e.sub &&
                <span style={{ color: C.inkMuted, fontWeight: 400, display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
                      <span>·</span>
                      <EditableText storeKey={'exp-sub-' + k} tag="span" defaultHtml={e.sub} placeholder="detail" />
                    </span>
                }
                </div>
                <EditableText storeKey={'exp-note-' + k} defaultHtml={e.note} placeholder="description"
              style={{ marginTop: 6, fontFamily: 'var(--font-ui)', fontSize: 16, color: C.inkSoft, lineHeight: 1.55 }} />
              </div>
            </div>

          )}
        </div>
        {exp.count > 0 &&
        <div style={{ marginTop: 16 }}>
            <RestoreChip count={exp.count} onRestore={exp.restoreAll} />
          </div>
        }

        {/* Resume CTA → Google Doc */}
        <div className="reveal" style={{
          marginTop: 50, padding: 'clamp(24px, 4vw, 40px) clamp(20px, 4vw, 48px)',
          background: C.burgundy, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap'
        }}>
          <div>
            <EditableText storeKey="cta-title" defaultHtml="Want the full resume?" placeholder="CTA heading"
            style={{
              fontFamily: 'var(--font-headline)',
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 600',
              fontSize: 32, color: C.softPink, lineHeight: 1.05
            }} />
            <EditableText storeKey="cta-sub" defaultHtml="Opens as a Google Doc — always the latest version." placeholder="subtext"
            style={{ marginTop: 8, fontFamily: 'var(--font-ui)', fontSize: 15, color: 'rgba(255,255,255,0.8)' }} />
          </div>
          <a href="resume.html"
          className="btn btn-primary"
          style={{ background: C.softPink, color: C.burgundy }}>
            View resume <span className="btn-arrow" aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      {/* ── CAROUSEL ── */}
      <section className="about-carousel-section" style={{ position: 'relative', padding: '70px 100px 80px', background: C.peach }}>
        <SectionHead eyebrowKey="car-eyebrow" eyebrow="moments"
        headKey="car-head" head="A few frames from off the clock." align="center" />
        <div className="reveal"><PhotoBoard /></div>
      </section>

      <Footer />
    </div>
    </window.PageEditCtx.Provider>);
}

Object.assign(window, { AboutPage });