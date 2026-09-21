import { BLACK_CARRYOVER_CAP, PC_CASH_PER_HOUR, WEEKS } from '../lib/grades';
import { int } from '../lib/format';
import type { Grade } from '../lib/types';

interface Props {
  grade: Grade;
  alreadyCash: number;
  pcCash: number;
  needCash: number;
}

/**
 * 목표 캐시를 무엇으로 채우는지 보여주는 막대.
 * 이미 누적 / PC방 환산 / 추가 결제 세 몫으로 나눈다.
 */
export function TargetComposition({ grade, alreadyCash, pcCash, needCash }: Props) {
  const alreadyUsed = Math.min(alreadyCash, grade.req);
  const pcUsed = Math.min(pcCash, Math.max(0, grade.req - alreadyUsed));
  const have = alreadyCash + pcCash;
  const denom = Math.max(grade.req, have) || 1;
  const widthOf = (v: number) => `${(v / denom) * 100}%`;

  const achieved = have >= grade.req;
  const over = have - grade.req;
  const hoursOnlyNeeded = Math.max(0, grade.req - alreadyCash) / PC_CASH_PER_HOUR / WEEKS;

  return (
    <div className="comp">
      <div className="comp-head">
        <span>
          목표 <b>{int(grade.req)}</b> 캐시를 어떻게 채우는가
        </span>
        <span>
          {needCash > 0 ? (
            <>
              현금으로 채울 <b>{int(needCash)}</b> 캐시
            </>
          ) : (
            <b>추가 결제 없음</b>
          )}
        </span>
      </div>

      <div className="comp-track">
        <div className="comp-seg" style={{ width: widthOf(alreadyUsed), background: 'var(--seg-already)' }} />
        <div className="comp-seg" style={{ width: widthOf(pcUsed), background: 'var(--seg-pc)' }} />
        <div className="comp-seg" style={{ width: widthOf(needCash), background: 'var(--accent)' }} />
      </div>

      <div className="comp-legend">
        {alreadyUsed > 0 && (
          <span className="lg">
            <i style={{ background: 'var(--seg-already)' }} />
            이미 누적 <b>{int(alreadyUsed)}</b>
          </span>
        )}
        {pcUsed > 0 && (
          <span className="lg">
            <i style={{ background: 'var(--seg-pc)' }} />
            PC방 환산 <b>{int(pcUsed)}</b>
          </span>
        )}
        {needCash > 0 && (
          <span className="lg">
            <i style={{ background: 'var(--accent)' }} />
            추가 결제 <b>{int(needCash)}</b>
          </span>
        )}
      </div>

      <p className={`comp-note ${achieved ? 'ok' : 'short'}`}>
        {achieved
          ? `${grade.name} 기준 이미 충족` +
            (over > 0
              ? ` · 초과 ${int(over)}캐시` +
                (grade.key === 'black'
                  ? ` (블랙은 최대 ${int(BLACK_CARRYOVER_CAP)}까지 이월)`
                  : ' (초과분은 등급에 쓰이지 않습니다)')
              : '')
          : `PC방으로만 채우려면 주당 ${hoursOnlyNeeded.toLocaleString('ko-KR', {
              maximumFractionDigits: 1,
            })}시간이 필요합니다.`}
      </p>
    </div>
  );
}
