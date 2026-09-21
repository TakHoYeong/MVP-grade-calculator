import { calculate } from '../lib/calc';
import { GRADES, WEEKS, WEEKS_PER_MONTH } from '../lib/grades';
import { int, manwon, won } from '../lib/format';
import type { CalcState, GradeKey } from '../lib/types';

interface Props {
  state: CalcState;
  alreadyCash: number;
  current: GradeKey;
}

const COLS = 'minmax(64px, 0.9fr) 0.7fr 1fr 1.2fr 1fr 1fr';

/**
 * 같은 시세·할인 조건에서 6개 등급을 나란히 비교한다.
 * 각 등급의 기본 옥션 수수료를 적용하므로, 브론즈(5%)가 실버 이상(3%)보다
 * 회수에서 불리한 점까지 드러난다.
 */
export function GradeCompareTable({ state, alreadyCash, current }: Props) {
  return (
    <div className="rows" style={{ ['--cols' as string]: COLS }}>
      <div className="head-row" aria-hidden="true">
        <span>등급</span>
        <span>기준</span>
        <span>남은 캐시</span>
        <span>추가 비용</span>
        <span>유지 주당</span>
        <span>유지 월</span>
      </div>

      {GRADES.map((g) => {
        const ahead = calculate(state, g.req, g.fee, alreadyCash);
        const upkeep = calculate(state, g.req, g.fee, 0);
        const done = ahead.needCash <= 0;
        const pillClass = done ? 'done' : ahead.cost <= 0 ? 'gain' : '';

        return (
          <div key={g.key} className={`row cmp-row${g.key === current ? ' is-current' : ''}`}>
            <div className="cell-name">
              <span className="grade-name">{g.name}</span>
            </div>

            <div className="fields">
              <div>
                <span className="field-label">기준</span>
                <div className="calc-value muted">{manwon(g.req)}</div>
              </div>
              <div>
                <span className="field-label">남은 캐시</span>
                <div className="calc-value">{int(ahead.needCash)}</div>
              </div>
              <div>
                <span className="field-label">추가 비용</span>
                <div className="calc-value">
                  <span className={`cost-pill ${pillClass}`}>{done ? '달성' : won(ahead.cost)}</span>
                </div>
              </div>
              <div>
                <span className="field-label">유지 주당</span>
                <div className="calc-value muted">{won(upkeep.cost / WEEKS)}</div>
              </div>
              <div>
                <span className="field-label">유지 월</span>
                <div className="calc-value muted">{won((upkeep.cost / WEEKS) * WEEKS_PER_MONTH)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
