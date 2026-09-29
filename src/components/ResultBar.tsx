import { int, pct, won } from '../lib/format';
import { WEEKS, WEEKS_PER_MONTH } from '../lib/grades';
import type { CalcResult, Grade } from '../lib/types';

interface Props {
  grade: Grade;
  /** 앞으로 드는 비용 (이미 누적된 금액 반영) */
  result: CalcResult;
  /** 누적 0 기준 = 계속 유지할 때의 비용 */
  maintenance: CalcResult;
  /** 상세 내역 모달 열기 */
  onDetail: () => void;
  /** 덜 입력했거나 확인이 필요한 항목들 (없으면 경고 아이콘을 숨긴다) */
  warnings: string[];
}

/** 스크롤 중에도 화면에 남는 결과 요약 */
export function ResultBar({ grade, result, maintenance, onDetail, warnings }: Props) {
  return (
    <div className="result-bar">
      {/* 스크린리더 전용: 결과가 바뀌면 정중히(polite) 읽어 준다. 화면 표시는 그대로. */}
      <span className="sr-only" role="status" aria-live="polite">
        {grade.name}까지 추가로 드는 실제 현금 {int(result.cost)}원, 회수율 {pct(result.recovery)}
      </span>

      <div className="result-top">
        <div className="result-headline">
          <div className="result-label">{grade.name}까지 추가로 드는 실제 현금</div>
          <div className="result-figure-row">
            <div className="result-figure">
              {int(result.cost)}
              <small>원</small>
            </div>

            {warnings.length > 0 && (
              <span
                className="fig-warn"
                role="button"
                tabIndex={0}
                aria-label={`확인이 필요한 항목 ${warnings.length}건: ${warnings.join(' · ')}`}
              >
                <svg
                  className="fig-warn-ico"
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
                  aria-hidden="true"
                >
                  <path d="M12 3.5 22 20.5 2 20.5 Z" fill="currentColor" opacity="0.16" />
                  <path
                    d="M12 3.5 22 20.5 2 20.5 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="12"
                    y1="9.5"
                    x2="12"
                    y2="14.6"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="17.4" r="1.15" fill="currentColor" />
                </svg>
                {warnings.length > 1 && <span className="fig-warn-count">{warnings.length}</span>}
                <span className="fig-warn-tip" role="tooltip">
                  <b className="fig-warn-title">확인해 보세요</b>
                  <ul>
                    {warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </span>
              </span>
            )}
          </div>
        </div>
        <div className="badge">회수율 {pct(result.recovery)}</div>
      </div>

      <div className="result-sub-wrap">
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
        <button type="button" className="result-detail-btn" onClick={onDetail}>
          상세보기
        </button>
      </div>
    </div>
  );
}
