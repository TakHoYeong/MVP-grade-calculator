import { useState } from 'react';
import { NumberField } from './NumberField';
import { int, won } from '../lib/format';
import type { CashTier, TierFill } from '../lib/types';

interface Props {
  tiers: CashTier[];
  fills: TierFill[];
  onPatch: (id: string, patch: Partial<CashTier>) => void;
  onRemove: (id: string) => void;
  onAdd: (init?: Partial<Pick<CashTier, 'limit' | 'discount' | 'earn'>>) => void;
}

// 넓은 화면에서 한 줄에 놓이는 열 너비: 충전 금액 | 할인율 | 적립률 | 사용액 | 결제액 | 삭제
const TCOLS = 'minmax(94px, 1.4fr) 70px 70px minmax(70px, 0.9fr) minmax(88px, 1.1fr) 32px';

/**
 * 넥슨캐시 구매 조건.
 * 위 입력 폼에서 충전 금액·할인율·적립률을 넣고 '추가'하면 아래 리스트에 쌓인다.
 * 리스트 항목은 곧바로 인라인 수정·삭제할 수 있다.
 * 넓은 화면에서는 항목 하나가 한 줄에, 좁은 화면에서는 카드로 접힌다.
 */
export function TierTable({ tiers, fills, onPatch, onRemove, onAdd }: Props) {
  const [charge, setCharge] = useState<number | null>(null);
  const [discount, setDiscount] = useState<number | null>(null);
  const [earn, setEarn] = useState<number | null>(null);

  const handleAdd = () => {
    onAdd({ limit: charge, discount, earn });
    setCharge(null);
    setDiscount(null);
    setEarn(null);
  };

  return (
    <>
      {/* 조건 입력 폼 */}
      <div className="tier-add">
        <NumberField
          label="충전 금액"
          value={charge}
          placeholder="600,000"
          hideLabelOnWide={false}
          comma
          onChange={setCharge}
        />
        <NumberField
          label="할인율(%)"
          value={discount}
          placeholder="0"
          hideLabelOnWide={false}
          onChange={setDiscount}
        />
        <NumberField
          label="적립률(%)"
          value={earn}
          placeholder="0"
          hideLabelOnWide={false}
          onChange={setEarn}
        />
        <button type="button" className="tier-add-btn" onClick={handleAdd}>
          + 추가
        </button>
      </div>

      {/* 추가된 조건 리스트 (인라인 수정 가능) */}
      <div className="tier-list" style={{ ['--tcols' as string]: TCOLS }}>
        <div className="tier-head" aria-hidden="true">
          <span>충전 금액</span>
          <span>할인율(%)</span>
          <span>적립률(%)</span>
          <span>사용액</span>
          <span>결제액</span>
          <span />
        </div>

        {tiers.length === 0 && (
          <p className="tier-empty">위에서 충전 금액·할인율·적립률을 넣고 추가하세요.</p>
        )}

        {tiers.map((tier) => {
          const fill = fills.find((f) => f.tierId === tier.id);
          const used = fill?.used ?? 0;
          return (
            <div key={tier.id} className={`tier-item${used <= 0 ? ' is-unused' : ''}`}>
              <NumberField
                label="충전 금액"
                value={tier.limit}
                placeholder="나머지 전부"
                comma
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
              <div className="tier-cell">
                <span className="tier-cap">사용액</span>
                <div className="calc-value">{used > 0 ? int(used) : '-'}</div>
              </div>
              <div className="tier-cell">
                <span className="tier-cap">결제액</span>
                <div className="calc-value muted">{used > 0 ? won(fill?.paid ?? 0) : '-'}</div>
              </div>
              <button
                type="button"
                className="tier-del"
                onClick={() => onRemove(tier.id)}
                aria-label="이 조건 삭제"
                title="삭제"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
