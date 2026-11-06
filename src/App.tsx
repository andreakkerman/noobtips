import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { categories, type CategoryId } from './data/tips';
import { chooseSegment, initialState, segments, selectTip, transition, type GameEvent, type Tier } from './game/model';
import { HISTORY_KEY, RATINGS_KEY, loadHistory, loadRatings, save } from './game/storage';
import { arcadeAudio } from './game/audio';
import { Icon } from './components/Icon';
import { Wheel } from './components/Wheel';
import { TrashRating } from './components/TrashRating';
import { setUpdateBoundary, updateSession } from './pwa';

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReduced(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  return reduced;
}

function Particles({ tier }: { tier: Tier }) {
  const count = tier === 'legendary' ? 52 : tier === 'mega' ? 32 : 16;
  return <div className={`particles particles-${tier}`} aria-hidden="true">{Array.from({ length: count }, (_, i) => {
    const angle = i * 2.39996;
    const distance = 180 + (i * 67 % 340);
    return <i key={i} style={{ '--x': `${Math.cos(angle) * distance}px`, '--y': `${Math.sin(angle) * distance * .65}px`, '--r': `${i * 71}deg`, '--delay': `${i % 7 * 40}ms`, '--color': ['#ffcf80', '#a4eee0', '#fff1bc', '#e58c60'][i % 4] } as CSSProperties} />;
  })}</div>;
}

function Slogan() {
  return <h1 className="slogan">Tips waar je <s>niks</s><br /><em>misschien iets</em><br />aan hebt.</h1>;
}

export default function App() {
  const [started, setStarted] = useState(updateSession?.started ?? false);
  const [game, setGame] = useState({ ...initialState, category: updateSession?.category ?? initialState.category });
  const gameRef = useRef(game);
  const [ratings, setRatings] = useState(loadRatings);
  const [persisted, setPersisted] = useState(true);
  const history = useRef(loadHistory());
  const [sound, setSound] = useState(false);
  const [soundError, setSoundError] = useState(false);
  const audioBusy = useRef(false);
  const desiredSound = useRef(updateSession?.sound ?? true);
  const stage = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  // Calibrate each artwork to the same unchanged wheel layout.
  // Anchor the environment to the untransformed machine layout, not the viewport crop.
  useLayoutEffect(() => {
    if (!started || !stage.current) return;
    const machine = stage.current.querySelector<HTMLElement>('.wheel-machine')!;
    const align = () => {
      const mount = game.category === 'arc' ? { x: 1086, y: 490, diameter: 560 } : { x: 1080, y: 420, diameter: 650 };
      const scale = machine.offsetWidth / mount.diameter;
      let x = machine.offsetWidth / 2;
      let y = machine.offsetHeight / 2;
      for (let node: HTMLElement | null = machine; node && !node.classList.contains('arcade'); node = node.offsetParent as HTMLElement | null) {
        x += node.offsetLeft; y += node.offsetTop;
      }
      const background = backdrop.current!;
      background.style.setProperty('--art-width', `${1536 * scale}px`);
      background.style.setProperty('--art-height', `${1024 * scale}px`);
      background.style.setProperty('--art-x', `${x - mount.x * scale}px`);
      background.style.setProperty('--art-y', `${y - mount.y * scale}px`);
    };
    const observer = new ResizeObserver(align);
    observer.observe(machine); observer.observe(document.documentElement);
    align();
    return () => observer.disconnect();
  }, [started, game.category]);
  const tipHeading = useRef<HTMLHeadingElement>(null);
  const spinButton = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const send = useCallback((event: GameEvent) => {
    const next = transition(gameRef.current, event);
    setUpdateBoundary(next.phase === 'ready', { started: true, category: next.category, sound: desiredSound.current });
    gameRef.current = next; setGame(next);
  }, []);
  useEffect(() => {
    setUpdateBoundary(!started || game.phase === 'ready', { started, category: game.category, sound: desiredSound.current });
  }, [started, game.phase, game.category, sound]);
  const onLand = useCallback(() => {
    if (gameRef.current.phase !== 'spinning' || gameRef.current.landed) return;
    arcadeAudio.land(); send({ type: 'LAND' });
  }, [send]);

  useEffect(() => {
    if (game.phase !== 'spinning' || !game.landed) return;
    const timer = window.setTimeout(() => send({ type: 'REVEAL' }), reduced ? 20 : 320);
    return () => clearTimeout(timer);
  }, [game.phase, game.landed, reduced, send]);
  useEffect(() => {
    if (game.phase !== 'revealing' || !game.result) return;
    arcadeAudio.reveal(game.result.tier);
    tipHeading.current?.focus({ preventScroll: true });
    const timer = window.setTimeout(() => send({ type: 'RATE_READY' }), reduced ? 40 : game.result.tier === 'legendary' ? 1550 : game.result.tier === 'mega' ? 1150 : 800);
    return () => clearTimeout(timer);
  }, [game.phase, game.result, reduced, send]);

  const spin = () => {
    const state = gameRef.current;
    if (state.phase !== 'ready' && state.phase !== 'rating') return;
    // A quiet update may have reloaded the menu. Unlock audio on the next gesture.
    if (desiredSound.current && !arcadeAudio.enabled) void toggleSound();
    const selected = selectTip(state.category, history.current);
    const segment = chooseSegment();
    history.current = selected.history; save(HISTORY_KEY, history.current);
    arcadeAudio.spin(); send({ type: 'SPIN', tip: selected.tip, segment });
    if (window.matchMedia('(max-width: 800px)').matches) window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
    requestAnimationFrame(() => spinButton.current?.focus({ preventScroll: true }));
  };
  const changeCategory = (category: CategoryId) => { send({ type: 'CATEGORY', category }); arcadeAudio.button(); };
  const rate = (value: number) => {
    if (game.phase !== 'rating' || !game.result) return;
    const next = { ...ratings, [game.result.tip.id]: value }; setRatings(next); setPersisted(save(RATINGS_KEY, next)); arcadeAudio.rate(value);
  };
  const toggleSound = async () => {
    if (audioBusy.current) return; audioBusy.current = true;
    const wasEnabled = arcadeAudio.enabled;
    const enabled = await arcadeAudio.toggle(); desiredSound.current = !wasEnabled; setSound(enabled); setSoundError(!wasEnabled && !enabled); audioBusy.current = false;
  };
  const start = () => {
    void toggleSound();
    setStarted(true);
    requestAnimationFrame(() => spinButton.current?.focus({ preventScroll: true }));
  };
  const backToMenu = () => {
    changeCategory(game.category);
    requestAnimationFrame(() => spinButton.current?.focus({ preventScroll: true }));
  };
  const resultVisible = game.phase === 'revealing' || game.phase === 'rating';
  const busy = game.phase === 'spinning' || game.phase === 'revealing';
  const category = categories.find(c => c.id === game.category)!;
  const result = game.result;

  return <main className={`arcade phase-${started ? game.phase : 'welcome'} ${result ? `tier-${result.tier}` : ''} ${reduced ? 'reduced-motion' : ''}`} data-phase={started ? game.phase : 'welcome'} data-category={game.category} data-spin={game.spin} data-tier={result?.tier} data-tip-id={result?.tip.id}>
    <div ref={backdrop} className="scene-background" aria-hidden="true" /><div className="scene-vignette" aria-hidden="true" />
    <header className="topbar">
      <div className="brand" aria-label="Noobtips.nl"><div className="brand-mark" aria-hidden="true">N<Icon name="spark" /></div><div><div className="brand-word">noobtips<span>.nl</span></div></div></div>
      {started && <div className="top-controls"><button type="button" className="sound-button" aria-label={sound ? 'Geluid uitzetten' : 'Geluid aanzetten'} aria-pressed={sound} onClick={toggleSound}><Icon name={sound ? 'sound' : 'mute'} /><span>GELUID {sound ? 'AAN' : 'UIT'}</span></button></div>}
    </header>
    {soundError && <div className="audio-notice" role="status">Geluid is hier niet beschikbaar. Het rad draait gewoon door.</div>}
    {!started && <section className="welcome-screen" aria-label="Welkom bij Noobtips">
      <Slogan />
      <button type="button" className="primary-button play-button" onClick={start}><span>SPELEN!</span><Icon name="arrow" /></button>
    </section>}
    {started && <section className="game-stage" aria-label="Het Noobrad">
      <div className="ready-copy" aria-hidden={resultVisible} inert={resultVisible}>
        <Slogan />
        <div className="category-section">
          <div className="section-label">KIES JE ONDERWERP</div>
          <div className="categories" role="group" aria-label="Kies je onderwerp">{categories.map(c => <button type="button" key={c.id} className={`category ${c.id === game.category ? 'selected' : ''}`} aria-pressed={c.id === game.category} disabled={busy} onClick={() => changeCategory(c.id)}><Icon name={c.icon} /><span>{c.name}</span>{c.id === game.category && <i />}</button>)}</div>
        </div>
        <div className="launch-section">
          <button type="button" ref={spinButton} className="primary-button spin-button" disabled={game.phase === 'spinning'} onClick={spin}><Icon name={game.phase === 'spinning' ? 'orbit' : 'rotate'} /><span>{game.phase === 'spinning' ? (game.landed ? 'DAAR KOMT IE…' : 'HET RAD DRAAIT…') : 'DRAAI HET NOOBRAD!'}</span><Icon name="arrow" /></button>
        </div>
      </div>
      <div ref={stage} className="machine-area"><Wheel game={game} reduced={reduced} onLand={onLand} /></div>
      {resultVisible && result && <section className={`reveal-scene reveal-${result.tier}`} key={game.spin} aria-label="Jouw noobtip">
        <div className="reveal-rays" aria-hidden="true" /><div className="reveal-glow" aria-hidden="true" /><Particles tier={result.tier} />
        <div className="result-meta"><span><Icon name={category.icon} />{category.name}</span></div>
        <div className="reveal-content">
          <div className="reveal-emblem"><Icon name={result.tier === 'legendary' ? 'crown' : result.tier === 'mega' ? 'bolt' : 'spark'} /></div>
          <div className="reveal-title">{segments[result.segment].label}</div>
          <div className="tip-wrap"><span className="quote-mark" aria-hidden="true">“</span><h2 ref={tipHeading} tabIndex={-1} className={`tip-text ${result.tip.text.length > 110 ? 'tip-long' : ''}`}>{result.tip.text}</h2></div>
          <div className="result-actions" inert={game.phase !== 'rating'} aria-hidden={game.phase !== 'rating'}>
            <TrashRating key={result.tip.id} value={ratings[result.tip.id] ?? 0} onChange={rate} persisted={persisted} />
            <button type="button" className="primary-button replay-button" onClick={spin}><Icon name="rotate" /><span>NOG EEN KEER DRAAIEN!</span><Icon name="arrow" /></button>
            <button type="button" className="menu-button" onClick={backToMenu}>TERUG NAAR HOOFDMENU</button>
          </div>
        </div>
      </section>}
    </section>}
    <div className="sr-only" role="status" aria-live="polite">{game.phase === 'spinning' ? 'Het Noobrad draait.' : game.phase === 'rating' && result ? `${segments[result.segment].label}. ${result.tip.text}` : ''}</div>
    {started && <footer className="footer" aria-hidden="true" />}
  </main>;
}
