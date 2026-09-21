import { NumberField } from './NumberField';
import { int, won } from '../lib/format';
import type { CashTier, TierFill } from '../lib/types';

interface Props {
  tiers: CashTier[];
  fills: TierFill[];
  onPatch: (id: string, patch: Partial<CashTier>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

const COLS = 'minmax(104px, 1.5fr) 0.95fr 0.7fr 0.7fr 0.95fr 1fr 32px';

/** 넥슨캐시 구매 조건 표. 필요 금액을 위에서부터 한도만큼 채운다. */
export function TierTable({ tiers, fills, onPatch, onRemove, onAdd }: Props) {
  return (
    <>
      <div className="rows" style={{ ['--cols' as string]: COLS }}>
        <div className="head-row" aria-hidden="true">
          <span>조건명</span>
          <span>한도(캐시)</span>
          <span>할인율(%)</span>
          <span>적립률(%)</span>
          <span>사용액</span>
          <span>결제액</span>
          <span />
        </div>

        {tiers.map((tier) => {
          const fill = fills.find((f) => f.tierId === tier.id);
          const used = fill?.used ?? 0;
          return (
            <div key={tier.id} className={`row${used <= 0 ? ' is-unused' : ''}`}>
              <div className="cell-name">
                <label className="field-label" htmlFor={`tier-name-${tier.id}`}>
                  조건명
                </label>
                <input
                  id={`tier-name-${tier.id}`}
                  className="txt"
                  type="text"
                  value={tier.name}
                  placeholder="조건명"
                  aria-label="조건명"
                  onChange={(e) => onPatch(tier.id, { name: e.target.value })}
                />
              </div>

              <div className="fields">
                <NumberField
                  label="한도(캐시)"
                  value={tier.limit}
                  placeholder="나머지 전부"
                  onChange={(v) => onPatch(tier.id, { limit: v })}
                />
                <NumberField
                  label="할인율(%)"
                  value={tier.discount}
                  placeholder="0"
                  onChange={(v) => onPatch(tier.id, { discount: v })}
                />
                <NumberField
                  label="적립률(%)"
                  value={tier.earn}
                  placeholder="0"
                  onChange={(v) => onPatch(tier.id, { earn: v })}
                />
              </div>

              <div className="calcs">
                <div>
                  <span className="field-label">사용액</span>
                  <div className="calc-value">{used > 0 ? int(used) : '-'}</div>
                </div>
                <div>
                  <span className="field-label">결제액</span>
                  <div className="calc-value muted">{used > 0 ? won(fill?.paid ?? 0) : '-'}</div>
                </div>
              </div>

              <button
                type="button"
                className="del"
                onClick={() => onRemove(tier.id)}
                aria-label={`${tier.name || '조건'} 삭제`}
                title="삭제"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className="add-row" onClick={onAdd}>
        + 조건 추가
      </button>
    </>
  );
}
