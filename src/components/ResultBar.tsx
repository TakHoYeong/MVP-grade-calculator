import { int, pct, won } from '../lib/format';
import { WEEKS, WEEKS_PER_MONTH } from '../lib/grades';
import type { CalcResult, Grade } from '../lib/types';

interface Props {
  grade: Grade;
  /** 앞으로 드는 비용 (이미 누적된 금액 반영) */
  result: CalcResult;
  /** 누적 0 기준 = 계속 유지할 때의 비용 */
  maintenance: CalcResult;
}

/** 스크롤 중에도 화면에 남는 결과 요약 */
export function ResultBar({ grade, result, maintenance }: Props) {
  return (
    <div className="result-bar">
      <div className="result-top">
        <div>
          <div className="result-label">{grade.name}까지 추가로 드는 실제 현금</div>
          <div className="result-figure">
            {int(result.cost)}
            <small>원</small>
          </div>
        </div>
        <div className="badge">회수율 {pct(result.recovery)}</div>
      </div>

      <div className="result-sub">
        <div>
          추가 순지출<b>{won(result.spend)}</b>
        </div>
        <div>
          환전 회수<b>{won(result.cashBack)}</b>
        </div>
        <div>
          유지 주당<b>{won(maintenance.cost / WEEKS)}</b>
        </div>
        <div>
          유지 월<b>{won((maintenance.cost / WEEKS) * WEEKS_PER_MONTH)}</b>
        </div>
      </div>

    </div>
  );
}
