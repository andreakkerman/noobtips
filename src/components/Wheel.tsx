import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { SEGMENT_ANGLE, SPIN_MS, segments, spinProgress, type GameState } from '../game/model';
import { arcadeAudio } from '../game/audio';
import { Icon } from './Icon';

const point = (angle: number, radius: number) => `${300 + Math.sin(angle * Math.PI / 180) * radius},${300 - Math.cos(angle * Math.PI / 180) * radius}`;
const sector = (angle: number, radius: number, inner: number) => `M${point(angle - 17.5, inner)} L${point(angle - 17.5, radius)} A${radius},${radius} 0 0 1 ${point(angle + 17.5, radius)} L${point(angle + 17.5, inner)} A${inner},${inner} 0 0 0 ${point(angle - 17.5, inner)}Z`;
export interface WheelHandle { finish(): void }
interface Props { game: GameState; reduced: boolean; onLand(): void }

export const Wheel = forwardRef<WheelHandle, Props>(function Wheel({ game, reduced, onLand }, ref) {
  const rotor = useRef<SVGGElement>(null);
  const pointer = useRef<SVGSVGElement>(null);
  const angle = useRef(0);
  const frame = useRef(0);
  const finish = useRef<() => void>(() => {});
  const onLandRef = useRef(onLand); onLandRef.current = onLand;
  useImperativeHandle(ref, () => ({ finish: () => finish.current() }), []);

  useEffect(() => {
    if (game.phase !== 'spinning' || game.landed || !game.result) return;
    const from = angle.current; const target = game.result.rotation;
    let done = false; let previousTick = -1; let lastSound = 0; let start: number | null = null;
    const apply = (value: number) => { angle.current = value; if (rotor.current) rotor.current.style.transform = `rotate(${value}deg)`; };
    finish.current = () => {
      if (done) return; done = true; cancelAnimationFrame(frame.current); apply(target); onLandRef.current();
    };
    if (reduced) {
      frame.current = requestAnimationFrame(() => finish.current());
      return () => { done = true; cancelAnimationFrame(frame.current); };
    }
    const animate = (time: number) => {
      start ??= time;
      const progress = Math.min(1, (time - start) / SPIN_MS);
      const next = from + (target - from) * spinProgress(progress);
      apply(next);
      const tick = Math.floor((next + SEGMENT_ANGLE / 2) / SEGMENT_ANGLE);
      if (tick !== previousTick && time - lastSound > 48 && !reduced) {
        previousTick = tick; lastSound = time; arcadeAudio.tick();
        pointer.current?.animate([{ transform: 'rotate(-13deg)' }, { transform: 'rotate(0)' }], { duration: 95, easing: 'ease-out' });
      }
      if (progress < 1) frame.current = requestAnimationFrame(animate); else finish.current();
    };
    frame.current = requestAnimationFrame(animate);
    return () => { done = true; cancelAnimationFrame(frame.current); };
  }, [game.spin, game.phase, game.landed, game.result, reduced]);

  return <div className={`wheel-machine ${game.phase === 'spinning' ? 'is-spinning' : ''} ${game.landed ? 'is-landed' : ''}`} data-testid="wheel" data-rotation={game.rotation} data-segment={game.result?.segment}>
    <div className="wheel-aura" />
    <div className="wheel-plinth"><i /><span>N–00B</span><i /></div>
    <svg className="wheel-svg" viewBox="0 0 600 600" role="img" aria-label="Het Noobrad: tien vakken, waarvan één legendarisch" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brass" x1="0" y1="0" x2="0.8" y2="1"><stop stopColor="#ffe0a0" /><stop offset=".18" stopColor="#be8151" /><stop offset=".46" stopColor="#5b3c29" /><stop offset=".7" stopColor="#cc955c" /><stop offset="1" stopColor="#734b32" /></linearGradient>
        <linearGradient id="steel" x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#6e9c9f" /><stop offset=".3" stopColor="#233e47" /><stop offset=".6" stopColor="#0a1c25" /><stop offset="1" stopColor="#4f737b" /></linearGradient>
        <radialGradient id="hub" cx=".3" cy=".18" r=".85"><stop stopColor="#426b6b" /><stop offset=".6" stopColor="#14373e" /><stop offset="1" stopColor="#071c25" /></radialGradient>
        <linearGradient id="gold" x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#fff4bd" /><stop offset=".48" stopColor="#f4bc65" /><stop offset="1" stopColor="#b86a34" /></linearGradient>
        <linearGradient id="glass" x1=".15" y1="0" x2=".7" y2="1"><stop stopColor="#e3ffe2" stopOpacity=".2" /><stop offset=".44" stopColor="#b7f5e2" stopOpacity=".035" /><stop offset=".45" stopColor="#071d27" stopOpacity=".1" /><stop offset="1" stopColor="#02141c" stopOpacity=".24" /></linearGradient>
        <linearGradient id="rimSheen" x1=".2" y1="0" x2=".75" y2="1"><stop stopColor="#fff2c5" stopOpacity=".85" /><stop offset=".38" stopColor="#fff0d0" stopOpacity=".08" /><stop offset=".62" stopColor="#00141d" stopOpacity=".75" /><stop offset="1" stopColor="#f8d5a2" stopOpacity=".5" /></linearGradient>
        <radialGradient id="faceShade"><stop stopColor="#001b28" stopOpacity=".74" /><stop offset=".6" stopColor="#00151c" stopOpacity=".08" /><stop offset=".88" stopColor="#06191d" stopOpacity=".1" /><stop offset="1" stopColor="#041318" stopOpacity=".7" /></radialGradient>
        <pattern id="etch" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6 6 0" stroke="#fff" opacity=".045" strokeWidth=".7" /></pattern>
      </defs>
      <circle cx="300" cy="308" r="286" fill="#020f15" />
      {Array.from({ length: 40 }, (_, i) => <rect key={i} x="290" y="12" width="20" height="29" rx="4" fill="url(#steel)" stroke="#15272d" strokeWidth="2" transform={`rotate(${i * 9} 300 300)`} />)}
      <circle cx="300" cy="300" r="280" fill="url(#brass)" stroke="#e7bf80" strokeWidth="2" />
      <circle cx="300" cy="300" r="272" fill="#081e26" stroke="#302a20" strokeWidth="3" />
      <circle cx="300" cy="300" r="260" fill="none" stroke="#426368" strokeWidth="12" />
      <circle cx="300" cy="300" r="260" fill="none" stroke="#a2f0d9" strokeWidth="3" className="rim-light" />
      {Array.from({ length: 40 }, (_, i) => <g key={i} transform={`rotate(${i * 9} 300 300)`}><rect x="296" y="33" width="8" height="13" rx="3" fill="#13292e" /><rect className="rim-bulb" x="298" y="36" width="4" height="7" rx="2" fill={i % 4 === 0 ? '#ffce78' : '#c3ffe6'} /></g>)}
      <circle cx="300" cy="300" r="250" fill="#061a22" stroke="#daa16a" strokeWidth="3" />
      <g ref={rotor} className="wheel-rotor" data-testid="rotor">
        {segments.map((segment, i) => <g key={i}>
          <path d={sector(i * 36, 246, 70)} fill={segment.color} stroke="#09232b" strokeWidth="2" />
          <path className={game.landed && game.result?.segment === i ? 'selected-sector' : ''} d={sector(i * 36, 238, 87)} fill="none" stroke="#ffedbd" strokeOpacity=".27" strokeWidth="1" />
          <path d={`M${point(i * 36 - 16, 233)} A233,233 0 0 1 ${point(i * 36 + 16, 233)}`} fill="none" stroke="#ffe9b6" strokeOpacity=".25" strokeWidth="2" />
          <g transform={`rotate(${i * 36} 300 300)`} fill="#ffefd1">
            <path d="M296 66h8l-4 7Z" opacity=".8" />
            <text x="300" y="96" textAnchor="middle" className="sector-name">{segment.short}</text>
            <svg x="278" y="115" width="44" height="44" viewBox="0 0 24 24" className="sector-symbol"><Icon name={segment.icon} /></svg>
            <path d="M284 177h32M290 183h20" stroke="currentColor" opacity=".22" />
            <circle cx="300" cy="194" r="2" opacity=".45" />
            <path d="M291 204h18m-16 5h14m-11 5h8" stroke="#041b23" strokeWidth="2" opacity=".35" />
          </g>
          <path d={`M${point(i * 36 - 18, 83)} L${point(i * 36 - 18, 245)}`} stroke="url(#brass)" strokeWidth="3" />
        </g>)}
        <circle cx="300" cy="300" r="246" fill="url(#faceShade)" pointerEvents="none" />
        <circle cx="300" cy="300" r="246" fill="url(#etch)" pointerEvents="none" />
      </g>
      <circle cx="300" cy="300" r="246" fill="url(#glass)" pointerEvents="none" />
      <circle cx="300" cy="300" r="274" fill="none" stroke="url(#rimSheen)" strokeWidth="5" pointerEvents="none" />
      <path d="M77 203A242 242 0 0 1 453 113" stroke="#fff2ca" strokeWidth="1.5" strokeOpacity=".25" fill="none" />
      <circle cx="300" cy="305" r="91" fill="#04151b" opacity=".65" />
      <circle cx="300" cy="300" r="88" fill="url(#brass)" stroke="#e6ba78" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="79" fill="url(#steel)" stroke="#10282b" strokeWidth="3" />
      <circle cx="300" cy="300" r="71" fill="url(#hub)" stroke="#658783" strokeWidth="1" />
      <circle cx="300" cy="300" r="66" fill="none" stroke="#f1ca83" strokeOpacity=".25" strokeDasharray="1 7" />
      {[45,135,225,315].map(a => <g key={a} transform={`rotate(${a} 300 300)`}><circle cx="300" cy="217" r="3" fill="#172c2f" /><path d="M298 217h4" stroke="#e9c48c" strokeWidth="1" /></g>)}
      <path d="m283 267 9-10 9 9 9-9 8 10-5 8h-25Z" fill="url(#gold)" />
      <text x="300" y="311" textAnchor="middle" className="hub-word" fill="#fff0cc">NOOB</text>
      <text x="300" y="334" textAnchor="middle" className="hub-sub" fill="#adc9c3">TIP-O-MAAT</text>
      <path d="M278 346h44" stroke="#dbaa62" strokeWidth="1.5" />
      <path d="M240 282A62 62 0 0 1 350 264" fill="none" stroke="#d6e4c2" strokeOpacity=".33" strokeWidth="2" />
      {[45,135,225,315].map(a => <g key={a} transform={`rotate(${a} 300 300)`}><rect x="290" y="16" width="20" height="24" rx="3" fill="url(#brass)" stroke="#563b2c" /><circle cx="300" cy="26" r="4" fill="#253b40" /><path d="M298 26h4" stroke="#bcc3ab" /></g>)}
    </svg>
    <svg ref={pointer} className="wheel-pointer" viewBox="0 0 64 100" aria-hidden="true"><defs><linearGradient id="pointerGold" x2="1" y2="1"><stop stopColor="#fff8ce" /><stop offset=".45" stopColor="#ffd888" /><stop offset="1" stopColor="#b56e32" /></linearGradient></defs><path d="m7 13 25-7 25 7-6 42-19 37L13 55Z" fill="#071b23" stroke="#021118" strokeWidth="6" /><path d="m8 9 24-7 24 7-6 41-18 36L14 50Z" fill="url(#pointerGold)" stroke="#f7dca1" strokeWidth="2" /><path d="m25 35 7 36 8-36" fill="#8f542b" /><circle cx="32" cy="20" r="10" fill="#15353c" stroke="#d5ae72" strokeWidth="3" /><circle cx="32" cy="20" r="4" fill="#bbf7d9" /></svg>
    <div className="wheel-plate"><span className="plate-dot" />{game.phase === 'spinning' ? (game.landed ? segments[game.result!.segment].label : 'WIJSHEID WORDT GEZOCHT…') : 'DE TIP-O-MAAT 3000'}<span className="plate-dot" /></div>
  </div>;
});
