// case-study.jsx
// Page wrapper for the editable case-study builder.

const CS_RENDERERS = {
  intro:     (s, ops) => <CSIntro     s={s} ops={ops} />,
  gate:      (s, ops) => <CSGate      s={s} ops={ops} />,
  fullImage: (s, ops) => <CSFullImage s={s} ops={ops} />,
  processFlow:(s, ops) => <CSProcessFlow s={s} ops={ops} />,
  branchFlow: (s, ops) => <CSBranchFlow s={s} ops={ops} />,
  imageText: (s, ops) => <CSImageText s={s} ops={ops} />,
  gallery:   (s, ops) => <CSGallery   s={s} ops={ops} />,
  carousel:  (s, ops) => <CSCarousel  s={s} ops={ops} />,
  pinboard:  (s, ops) => <CSPinboard  s={s} ops={ops} />,
  video:     (s, ops) => <CSVideo     s={s} ops={ops} />,
  quote:     (s, ops) => <CSQuote     s={s} ops={ops} />,
  process:   (s, ops) => <CSProcess   s={s} ops={ops} />,
  insights:  (s, ops) => <CSInsights  s={s} ops={ops} />,
  metrics:   (s, ops) => <CSMetrics   s={s} ops={ops} />,
  outcome:   (s, ops) => <CSOutcome   s={s} ops={ops} />,
  priorities:(s, ops) => <CSPriorities s={s} ops={ops} />,
  insightCards:(s, ops) => <CSInsightCards s={s} ops={ops} />,
  conceptCards:(s, ops) => <CSConceptCards s={s} ops={ops} />,
  featureShowcase:(s, ops) => <CSFeatureShowcase s={s} ops={ops} />,
};

// localStorage-backed object state (hero / meta / next).
function useLocalState(key, initial) {
  const [val, setVal] = React.useState(() => {
    try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw); } catch (e) {}
    return initial;
  });
  React.useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }, [key, val]);
  return [val, setVal];
}

// ─── floating nav ─────────────────────────────────────────────────────────
function CSNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isMob = useIsMobile();
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = [
    { href: 'index.html#work', label: 'Featured Work' },
    { href: 'personal-art.html', label: 'Personal Art' },
    { href: 'about.html', label: 'About' },
    { href: 'about.html#resume', label: 'Resume' },
  ];
  const linkStyle = { color: 'inherit', textDecoration: 'none', padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap' };
  const textColor = scrolled ? 'var(--ink)' : '#fff';
  return (
    <div className="cs-nav" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      transition: 'background .3s ease, box-shadow .3s ease',
      background: scrolled ? 'rgba(250, 243, 232, 0.94)' : (menuOpen ? 'rgba(250,243,232,0.98)' : 'transparent'),
      backdropFilter: (scrolled || menuOpen) ? 'blur(10px) saturate(1.2)' : 'none',
      WebkitBackdropFilter: (scrolled || menuOpen) ? 'blur(10px) saturate(1.2)' : 'none',
      boxShadow: scrolled ? '0 1px 0 var(--border)' : 'none',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: isMob ? '14px 20px' : '18px 80px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        color: textColor,
      }}>
        <a href="index.html" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none',
          color: 'inherit', fontFamily: 'var(--font-headline)',
          fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 700',
          fontSize: isMob ? 18 : 22, letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 14 }}>←</span><span>Pri Jain</span>
        </a>
        {isMob ? (
          <button onClick={() => setMenuOpen(o => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: textColor,
              fontSize: 22, width: 40, height: 40, display: 'flex',
              alignItems: 'center', justifyContent: 'center', borderRadius: 8
            }}>
            {menuOpen ? '\u2715' : '\u2630'}
          </button>
        ) : (
          <nav style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, letterSpacing: '0.03em',
          }}>
            {links.map(l => <a key={l.href} href={l.href} style={linkStyle}>{l.label}</a>)}
          </nav>
        )}
      </div>
      {isMob && menuOpen && (
        <div style={{
          background: 'rgba(250,243,232,0.98)', backdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--border)',
        }}>
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', padding: '14px 24px',
                fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600,
                color: 'var(--ink)', textDecoration: 'none', letterSpacing: '0.01em',
                borderBottom: '1px solid var(--border)'
              }}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── edit toolbar ───────────────────────────────────────────────────────────
function EditToolbar({ edit, setEdit, onReset, onHistory, pageKey }) {
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
  return (
    <div className="cs-toolbar" contentEditable={false}>
      <button className={`cs-tg ${edit ? 'on' : ''}`} onClick={() => setEdit(true)}>✎ Edit</button>
      <button className={`cs-tg ${!edit ? 'on' : ''}`} onClick={() => setEdit(false)}>◉ Preview</button>
      <span className="cs-tb-div" />
      <button className="cs-tb-hist" title="Version history — roll back to an earlier save"
        onClick={onHistory}>⟲ History</button>
      <span className="cs-tb-div" />
      <button className="cs-tb-save" title="Save to project — available on any device"
        onClick={() => window.csSidecarSave && window.csSidecarSave(pageKey)}>
        {saved ? '✓ Saved' : '💾 Save'}
      </button>
      <span className="cs-tb-div" />
      <button className="cs-tb-reset" title="Reset this page to the template defaults"
        onClick={onReset}>Reset</button>
    </div>
  );
}

// ─── reveal system (visible by default; hide off-screen before paint) ────────
function useRevealSystem() {
  React.useLayoutEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    const vh = () => window.innerHeight || 800;
    const BUF = 80;
    const flag = (root = document) => {
      root.querySelectorAll('.reveal').forEach((el) => {
        if (el.dataset.revealDone === '1') return;
        const r = el.getBoundingClientRect();
        if (r.top > vh() - BUF) el.setAttribute('data-reveal-pending', '');
        else el.dataset.revealDone = '1';
      });
    };
    const unflag = () => {
      document.querySelectorAll('.reveal[data-reveal-pending]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh() - BUF) { el.removeAttribute('data-reveal-pending'); el.dataset.revealDone = '1'; }
      });
    };
    flag();
    let raf = 0;
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; unflag(); }); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const io = ('IntersectionObserver' in window) ? new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.removeAttribute('data-reveal-pending'); e.target.dataset.revealDone = '1'; io.unobserve(e.target); }
      }), { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }) : null;
    if (io) document.querySelectorAll('.reveal[data-reveal-pending]').forEach((el) => io.observe(el));
    const mo = new MutationObserver((muts) => {
      muts.forEach((m) => m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        flag(n);
        if (io) [...(n.matches?.('.reveal[data-reveal-pending]') ? [n] : []),
          ...(n.querySelectorAll?.('.reveal[data-reveal-pending]') || [])].forEach((el) => io.observe(el));
      }));
      unflag();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      if (io) io.disconnect(); mo.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

// ─── REFRESH SKETCH BUTTON ───────────────────────────────────────────────────
function RefreshSketchBtn({ href, label, color = 'var(--orange)' }) {
  const [hovered, setHovered] = React.useState(false);
  const [key, setKey] = React.useState(0);
  const handleEnter = () => { setKey(k => k + 1); setHovered(true); };
  const handleLeave = () => setHovered(false);
  return (
    <a href={href} className="cs-refresh-btn"
      onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {hovered && (
        <svg key={key} viewBox="0 0 200 56" preserveAspectRatio="none" aria-hidden="true" style={{
          position: 'absolute', left: -10, right: -10, top: -4, bottom: -4,
          width: 'calc(100% + 20px)', height: 'calc(100% + 8px)',
          pointerEvents: 'none', zIndex: 0, overflow: 'visible',
        }}>
          <path d="M 14 28 C 14 12,56 5,100 5 C 144 5,186 12,186 28 C 186 44,144 51,100 51 C 56 51,14 44,14 28 Z"
            fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" pathLength="100"
            style={{ strokeDasharray: 100, strokeDashoffset: 100, animation: 'sketchDraw .5s cubic-bezier(.55,.1,.35,1) forwards' }} />
          <path d="M 18 30 C 20 14,60 8,102 7 C 142 6,184 14,182 30 C 180 46,142 52,100 53 C 58 53,18 46,18 30"
            fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" pathLength="100" opacity="0.5"
            style={{ strokeDasharray: 100, strokeDashoffset: 100, animation: 'sketchDraw .55s .08s cubic-bezier(.55,.1,.35,1) forwards' }} />
        </svg>
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
    </a>
  );
}

// ─── main page ──────────────────────────────────────────────────────────────
function CaseStudy({ pageKey = 'cs', defaults }) {
  const [edit, setEdit] = React.useState(() => {
    if (!window.siteCanEdit()) return false;
    const v = localStorage.getItem(`cs:${pageKey}:edit`);
    return v === null ? true : v === '1';
  });
  React.useEffect(() => {
    localStorage.setItem(`cs:${pageKey}:edit`, edit ? '1' : '0');
    document.body.classList.toggle('cs-editing', edit);
  }, [pageKey, edit]);

  React.useEffect(() => {
    document.body.classList.add('case-study');
    return () => document.body.classList.remove('case-study', 'cs-editing');
  }, []);

  // ── password gate: unlock state (per-session) ──────────────────────────
  const [unlocked, setUnlocked] = React.useState(() => {
    try { return sessionStorage.getItem(`cs:${pageKey}:unlocked`) === '1'; } catch (e) { return false; }
  });
  const unlock = React.useCallback(() => {
    try { sessionStorage.setItem(`cs:${pageKey}:unlocked`, '1'); } catch (e) {}
    setUnlocked(true);
  }, [pageKey]);

  useRevealSystem();

  const [hero, setHero] = useLocalState(`cs:${pageKey}:hero`, defaults.hero);
  const [meta, setMeta] = useLocalState(`cs:${pageKey}:meta`, defaults.meta);
  const [next, setNext] = useLocalState(`cs:${pageKey}:next`, defaults.next);
  const [sections, ops] = useSections(pageKey, defaults.sections);

  // ── version history / recovery ─────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const live = React.useMemo(() => ({ hero, meta, next, sections }), [hero, meta, next, sections]);
  const applySnapshot = React.useCallback((data) => {
    if (!data) return;
    if (data.hero) { setHero(data.hero); try { localStorage.setItem(`cs:${pageKey}:hero`, JSON.stringify(data.hero)); } catch (e) {} }
    if (data.meta) { setMeta(data.meta); try { localStorage.setItem(`cs:${pageKey}:meta`, JSON.stringify(data.meta)); } catch (e) {} }
    if (data.next) { setNext(data.next); try { localStorage.setItem(`cs:${pageKey}:next`, JSON.stringify(data.next)); } catch (e) {} }
    if (Array.isArray(data.sections)) ops.setAll(data.sections);
  }, [pageKey, setHero, setMeta, setNext, ops]);
  const history = useVersionHistory(pageKey, live, applySnapshot);

  // ── auto-save to project sidecar (cross-device persistence) ───────────
  React.useEffect(() => {
    if (typeof window.csSidecarAutoSave === 'function') {
      window.csSidecarAutoSave(pageKey);
    }
  }, [hero, meta, next, sections, pageKey]);

  const ctx = React.useMemo(() => ({ edit, pageKey, unlocked, unlock }), [edit, pageKey, unlocked, unlock]);

  const resetAll = () => {
    if (!confirm('Reset this whole page back to the template defaults? Your edits and dropped images stay only for image slots.')) return;
    ['hero', 'meta', 'next', 'sections'].forEach((k) => localStorage.removeItem(`cs:${pageKey}:${k}`));
    setHero(defaults.hero); setMeta(defaults.meta); setNext(defaults.next); ops.reset();
  };

  // Sections after a locked gate stay hidden until the visitor unlocks (preview only).
  const gateIdx = sections.findIndex((s) => s.type === 'gate');
  const locked = !edit && !unlocked && gateIdx !== -1;

  return (
    <EditCtx.Provider value={ctx}>
    <window.PageEditCtx.Provider value={edit}>
      <div style={{ width: '100%', background: 'var(--cream)', color: 'var(--ink)' }}>
        <SiteNav active="none" />
        {window.siteCanEdit() &&
        <EditToolbar edit={edit} setEdit={setEdit} onReset={resetAll}
          onHistory={() => setHistoryOpen((v) => !v)} pageKey={pageKey} />
        }
        {edit && historyOpen && (
          <HistoryPanel
            snapshots={history.snapshots}
            onRestore={history.restore}
            onSnapshot={() => history.snapshotNow('manual')}
            onRemove={history.remove}
            onClose={() => setHistoryOpen(false)}
          />
        )}

        <CSHero hero={hero} update={(patch) => setHero((h) => ({ ...h, ...patch }))} />

        {meta && meta.length > 0 && (
          <CSMeta meta={meta} update={(m) => setMeta(m)} />
        )}

        <AddSectionBar index={0} ops={ops} />

        {sections.map((s, i) => {
          if (locked && i > gateIdx) return null;
          if (s.type === 'gate' && unlocked && !edit) return null;
          const render = CS_RENDERERS[s.type];
          // Adjacent sections that share the same s.bg visually group together.
          const prevBg = i > 0 ? sections[i - 1].bg : null;
          const sameAsAbove = s.bg && s.bg === prevBg;
          return (
            <React.Fragment key={s.id}>
              <div style={s.bg ? {
                background: s.bg,
                marginTop: sameAsAbove ? -1 : 0,
              } : {}}>
                <SectionFrame s={s} index={i} total={sections.length} ops={ops}>
                  {render ? render(s, ops) : (
                    <div className="cs-wrap" style={{ padding: '40px 0', color: 'var(--ink-muted)' }}>
                      Unknown section: {s.type}
                    </div>
                  )}
                </SectionFrame>
              </div>
              <AddSectionBar index={i + 1} ops={ops} />
            </React.Fragment>
          );
        })}

        {!locked && next && !next.hidden && (
          <CSNext next={next} update={(patch) => setNext((n) => ({ ...n, ...patch }))} />
        )}

        {!locked && next && next.hidden && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0 100px' }}>
            <button type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                display: 'inline-flex', alignItems: 'baseline', gap: 8,
                fontFamily: 'var(--font-script)', fontWeight: 700,
                fontSize: 34, lineHeight: 1, color: 'var(--ink)',
                background: 'transparent', border: 'none', padding: '6px 4px',
                cursor: 'pointer', transition: 'color .2s ease, transform .2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--pink)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.transform = 'none'; }}>
              back to top
              <span style={{ fontSize: 26, lineHeight: 1 }}>↑</span>
            </button>
          </div>
        )}

        <Footer />
      </div>
    </window.PageEditCtx.Provider>
    </EditCtx.Provider>
  );
}

Object.assign(window, { CaseStudy, CSNav });
