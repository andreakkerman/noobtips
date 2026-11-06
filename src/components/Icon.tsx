import type { CSSProperties } from 'react';

export function Icon({ name, className, style }: { name: string; className?: string; style?: CSSProperties }) {
  const paths: Record<string, React.ReactNode> = {
    trophy: <><path d="M7 3h10v6a5 5 0 0 1-10 0Z M7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 14v5m-4 2h8m-7-2h6" /></>,
    radar: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="m12 12 6-8M12 2v2M2 12h2M12 20v2M20 12h2" /><circle cx="8" cy="14" r="1" fill="currentColor" /></>,
    cube: <><path d="m12 2 9 5v10l-9 5-9-5V7Z M3 7l9 5 9-5M12 12v10M7.5 4.5l9 5" /></>,
    mushroom: <><path d="M3 13a9 9 0 0 1 18 0Z M8 13v5a4 4 0 0 0 8 0v-5" /><circle cx="8" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="7" r="1.5" fill="currentColor" /><path d="M10 16v2m4-2v2" /></>,
    pencil: <><path d="m4 16-1 5 5-1L21 7l-4-4Z M14 6l4 4M4 16l4 4" /></>,
    spark: <><path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z" /></>,
    bolt: <path d="m14 2-9 12h6l-1 8 9-12h-6Z" />,
    cross: <><path d="m6 6 12 12M18 6 6 18" /><circle cx="12" cy="12" r="10" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    orbit: <><circle cx="12" cy="12" r="4" /><ellipse cx="12" cy="12" rx="11" ry="5" transform="rotate(-40 12 12)" /></>,
    crown: <><path d="m2 6 6 5 4-8 4 8 6-5-3 13H5Z M6 22h12" /></>,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    sound: <><path d="m11 4-6 5H2v6h3l6 5Z M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
    mute: <><path d="m11 4-6 5H2v6h3l6 5Z M16 9l6 6m0-6-6 6" /></>,
    rotate: <><path d="M20 8a9 9 0 1 0 1 7M20 3v6h-6" /></>,
    check: <path d="m4 12 5 5L20 6" />,
    skip: <><path d="m4 4 12 8L4 20Z M20 4v16" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>{paths[name] ?? paths.spark}</svg>;
}
