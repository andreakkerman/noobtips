import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Icon } from './Icon';

const labels = ['Een beetje nutteloos', 'Behoorlijk waardeloos', 'Prachtige onzin', 'Ongekend kansloos', 'Glorieus waardeloos!'];

function Bin({ filled, overloaded, index, animation }: { filled: boolean; overloaded: boolean; index: number; animation: number }) {
  const id = useId().replaceAll(':', '');
  return <svg className={`trash-object ${filled ? 'filled' : ''} ${overloaded ? 'overloaded' : ''}`} viewBox="0 0 110 125" aria-hidden="true" style={{ '--delay': `${index * 55}ms` } as CSSProperties}>
    <defs>
      <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2=".3"><stop stopColor="#427d7d" /><stop offset=".25" stopColor="#81b3a2" /><stop offset=".55" stopColor="#4e938a" /><stop offset="1" stopColor="#1c5158" /></linearGradient>
      <linearGradient id={`${id}-rim`} x2="0" y2="1"><stop stopColor="#b1d4bc" /><stop offset=".35" stopColor="#5e9e91" /><stop offset=".6" stopColor="#235862" /><stop offset="1" stopColor="#143a45" /></linearGradient>
      <linearGradient id={`${id}-paper`} x2="1" y2="1"><stop stopColor="#ffefc1" /><stop offset="1" stopColor="#c8bb94" /></linearGradient>
    </defs>
    <ellipse cx="55" cy="113" rx="35" ry="6" fill="#020e15" opacity=".4" />
    <g className="bin-bounce" key={animation}>
      <path d="m25 57 6 48q24 13 48 0l6-48Z" fill={`url(#${id}-body)`} stroke="#153d45" strokeWidth="2" />
      <path d="M29 62q26 9 52 0" fill="none" stroke="#adceb6" strokeWidth="2" />
      <path d="m38 72 3 29m13-27v31m15-33-2 29" stroke="#17474b" strokeWidth="5" strokeLinecap="round" opacity=".65" />
      <path d="m36 71 3 29m13-27v31m15-33-2 29" stroke="#9bc4ae" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      <path d="M25 65h-5v14h7m58-14h5v14h-7" fill="none" stroke="#7faaa0" strokeWidth="4" strokeLinejoin="round" />
      <ellipse cx="55" cy="56" rx="31" ry="9" fill="#102d34" stroke="#a9c9ae" strokeWidth="3" />
      <g className="trash-fill">
        <path d="m30 48 3-15 12-5 13 10-4 17Z" fill={`url(#${id}-paper)`} stroke="#c2ac7e" /><path d="m34 34 8 11 12-6m-12 6-3 8" fill="none" stroke="#ab9c7a" />
        <path d="m62 51-3-15 12-8 13 10-4 15Z" fill="#e99569" stroke="#c66a48" /><path d="m64 38 12 4-8 8" fill="none" stroke="#ffca9a" strokeWidth="2" />
        <path d="M44 55q8-17 18-14l9 12" fill="#8dbac7" stroke="#4e8192" strokeWidth="2" />
        <path d="M54 28q4 15 20 17-15 5-22-3-2 11-13 13 9-13 9-22Z" fill="#ffce61" stroke="#d4983b" strokeWidth="1.5" />
        <path d="m51 29 2-6" stroke="#73624b" strokeWidth="4" strokeLinecap="round" />
      </g>
      <g className="extra-trash">
        <path d="m35 33-8-14 12-8 15 7-3 18Z" fill={`url(#${id}-paper)`} stroke="#cfbd94" /><path d="m30 20 12 4 7-5m-7 5-4 9" fill="none" stroke="#ab9c7a" />
        <path d="m61 35 2-23 9-4 12 9-8 23Z" fill="#91b5ca" stroke="#486f87" /><path d="m65 17 11 4m-12 2 10 4" stroke="#e2e4c6" strokeWidth="2" />
        <path d="m17 65-5-9 5-8 10 5-4 10Z" fill="#efca8b" />
        <path d="m86 70 6-11 5 6-4 10" fill="#f8ce60" stroke="#bc8c30" />
        <path d="m54 9 1-5m-33 28-5-3m76 11 5-3" stroke="#ffd877" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g className="bin-lid"><path d="M22 51q33-12 66 0v7q-33 11-66 0Z" fill={`url(#${id}-rim)`} stroke="#1a4248" strokeWidth="1.5" /><ellipse cx="55" cy="51" rx="33" ry="8" fill="#76a898" stroke="#bbd1af" strokeWidth="1.5" /><path d="M47 49v-6q8-5 16 0v6" fill="none" stroke="#244f55" strokeWidth="4" /><path d="M48 44q7-4 14 0" stroke="#c6d6b6" fill="none" strokeWidth="2" /></g>
      <path d="m48 88 7-8 8 8-8 8Z" fill="#f1d28d" /><path d="m54 84-2 5h5l-2 4" stroke="#4b7772" strokeWidth="1.5" fill="none" />
    </g>
  </svg>;
}

export function TrashRating({ value, onChange, persisted }: { value: number; onChange(value: number): void; persisted: boolean }) {
  const [preview, setPreview] = useState<number | null>(null);
  const [animation, setAnimation] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const shown = preview ?? value;
  const commit = (next: number) => { onChange(next); setAnimation(n => n + 1); setPreview(null); };
  const onKey = (event: KeyboardEvent, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = (index + 1) % 5;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = (index + 4) % 5;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 4;
    else return;
    event.preventDefault(); buttons.current[next]?.focus(); commit(next + 1);
  };
  return <div className="rating">
    <div className="rating-question" id="rating-question">Hoe slecht is deze tip?</div>
    <div className={`trash-row ${preview !== null ? 'is-preview' : ''}`} role="radiogroup" aria-labelledby="rating-question" onPointerLeave={() => setPreview(null)}>
      {[1,2,3,4,5].map((n, index) => <button key={n} ref={element => { buttons.current[index] = element; }} type="button" className={`trash-button ${value === n ? 'is-committed' : ''}`} role="radio" aria-checked={value === n} aria-label={`${n} van 5 — ${labels[index]}`} tabIndex={(value || 1) === n ? 0 : -1} onClick={() => commit(n)} onPointerEnter={event => { if (event.pointerType !== 'touch') setPreview(n); }} onFocus={() => setPreview(n)} onBlur={() => setPreview(null)} onKeyDown={event => onKey(event, index)}>
        <Bin filled={n <= shown} overloaded={shown === 5} index={index} animation={animation} /><span className="bin-number">{n}</span>
      </button>)}
    </div>
    <div className="rating-response" aria-live="polite">{shown > 0 ? <><span>{labels[shown - 1]}</span>{preview === null && value > 0 && <small><Icon name="check" />{persisted ? 'Op dit apparaat bewaard' : 'Voor deze speelsessie bewaard'}</small>}</> : <span>Meer prullenbakken = slechter advies.</span>}</div>
  </div>;
}
