import { Mountain } from './Mountain';
import { fiveCount } from '../game/ratings';
import { useEffect, useRef } from 'react';
import { categories } from '../data/tips';
import { rankTips } from '../game/leaderboard';
import type { Ratings } from '../game/storage';
import { Bin } from './TrashRating';
import { Icon } from './Icon';

export function Leaderboard({ ratings, onBack }: { ratings: Ratings; onBack(): void }) {
  const ranked = rankTips(ratings);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);

  return <section className="leaderboard" aria-labelledby="leaderboard-title">
    <header className="leaderboard-header">
      <div className="leaderboard-trophy" aria-hidden="true"><Icon name="trash" /></div>
      <div>
        <h1 id="leaderboard-title" ref={heading} tabIndex={-1}>DE <span>VUILNISBELT</span></h1>
      </div>
    </header>
    <div className="leaderboard-world"><Mountain count={fiveCount(ratings)} /><div className="ranking-panel"><h2 className="ranking-title">De 20 slechtste tips</h2>
    {ranked.length ? <div className="leaderboard-scroll" role="region" aria-label="Gerangschikte noobtips" tabIndex={0}>
      <ol className="leaderboard-list">
        {ranked.map((tip, index) => <li key={tip.id} className={`leaderboard-row place-${index + 1}`} data-tip-id={tip.id} data-rating={tip.rating}>
          <span className="leaderboard-position" aria-label={`Plaats ${index + 1}`}>{String(index + 1).padStart(2, '0')}</span>
          <div className="leaderboard-tip"><span className="leaderboard-category">{categories.find(category => category.id === tip.category)!.name}</span><p>{tip.text}</p></div>
          <div className="leaderboard-score" role="img" aria-label={`${tip.rating} van 5 prullenbakken`}>
            <Bin filled overloaded={tip.rating === 5} index={0} animation={0} />
            <span aria-hidden="true"><strong>{Number(tip.rating.toFixed(1))}</strong><small>/ 5</small></span>
          </div>
        </li>)}
      </ol>
    </div> : <div className="leaderboard-empty">
      <Bin filled={false} overloaded={false} index={0} animation={0} />
      <h2>Nog geen glorieuze onzin.</h2>
    </div>}
    </div></div>
    <footer className="leaderboard-footer">
      <button type="button" className="menu-button" onClick={onBack}>TERUG NAAR HOOFDMENU</button>
    </footer>
  </section>;
}
