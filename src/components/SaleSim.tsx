import { useState } from 'react';
import { NumberField } from './NumberField';
import { n } from '../lib/calc';
import { eok, int, won } from '../lib/format';
import type { CalcResult, SaleKind, SaleRow } from '../lib/types';

interface Props {
  sales: SaleRow[];
  result: CalcResult;
  onPatch: (id: string, patch: Partial<SaleRow>) => void;
  onRemove: (id: string) => void;
  onAdd: (init?: Partial<Pick<SaleRow, 'kind' | 'unitCost' | 'saleMeso' | 'qty'>>) => void;
}

// 넓은 화면 한 줄: 종류 | 가격 | 판매가(억) | 개수 | 판매메소 | 삭제
const SCOLS = '76px minmax(88px, 1.3fr) minmax(80px, 1fr) 58px minmax(80px, 1fr) 32px';

const costLabel = (kind: SaleKind) => (kind === 'credit' ? '필요크레딧' : '가격(원)');

/**
 * 판매 시뮬레이션 (3번 · 실제 계산).
 * "얼마짜리 아이템을 얼마에 몇 개 판다"를 행으로 쌓아 실제 회수·비용을 낸다.
 * 시장 상황에 맞춰 같은 아이템을 여러 가격대로 나눠 넣을 수 있다.
 */
export function SaleSim({ sales, result, onPatch, onRemove, onAdd }: Props) {
  const [kind, setKind] = useState<SaleKind>('cash');
  const [unitCost, setUnitCost] = useState<number | null>(null);
  const [saleMeso, setSaleMeso] = useState<number | null>(null);
  const [qty, setQty] = useState<number | null>(null);

  const handleAdd = () => {
    onAdd({ kind, unitCost, saleMeso, qty });
    setUnitCost(null);
    setSaleMeso(null);
    setQty(null);
  };

  const { cashUsed, creditUsed, mesoRaw } = result.sale;
  const cashDiff = cashUsed - result.needCash;
  const creditOver = creditUsed > result.creditAvailable;

  return (
    <>
      {/* 판매 입력 폼 */}
      <div className="sim-add">
        <label className="sim-kind-wrap">
          <span className="field-label" style={{ display: 'block' }}>
            종류
          </span>
          <select
            className="sim-kind"
            value={kind}
            aria-label="재화 종류"
            onChange={(e) => setKind(e.target.value as SaleKind)}
          >
            <option value="cash">캐시</option>
            <option value="credit">크레딧</option>
          </select>
        </label>
        <NumberField
          label={costLabel(kind)}
          value={unitCost}
          placeholder={kind === 'credit' ? '20,000' : '99,000'}
          hideLabelOnWide={false}
          comma
          onChange={setUnitCost}
        />
        <NumberField
          label="판매가(억)"
          value={saleMeso}
          placeholder="45"
          hideLabelOnWide={false}
          comma
          onChange={setSaleMeso}
        />
        <NumberField
          label="개수"
          value={qty}
          placeholder="10"
          hideLabelOnWide={false}
          onChange={setQty}
        />
        <button type="button" className="sim-add-btn" onClick={handleAdd}>
          + 추가
        </button>
      </div>

      {/* 판매 목록 (인라인 수정 가능) */}
      <div className="sim-list" style={{ ['--scols' as string]: SCOLS }}>
        <div className="sim-head" aria-hidden="true">
          <span>종류</span>
          <span>가격</span>
          <span>판매가(억)</span>
          <span>개수</span>
          <span>판매메소</span>
          <span />
        </div>

        {sales.length === 0 && (
          <p className="sim-empty">위에서 종류·가격·판매가·개수를 넣고 추가하세요.</p>
        )}

        {sales.map((s) => {
          const meso = n(s.saleMeso) * n(s.qty);
          return (
            <div key={s.id} className="sim-item">
              <label className="sim-kind-wrap">
                <span className="field-label">종류</span>
                <select
                  className="sim-kind"
                  value={s.kind}
                  aria-label="재화 종류"
                  onChange={(e) => onPatch(s.id, { kind: e.target.value as SaleKind })}
                >
                  <option value="cash">캐시</option>
                  <option value="credit">크레딧</option>
                </select>
              </label>
              <NumberField
                label={costLabel(s.kind)}
                value={s.unitCost}
                placeholder={s.kind === 'credit' ? '20,000' : '99,000'}
                comma
                onChange={(v) => onPatch(s.id, { unitCost: v })}
              />
              <NumberField
                label="판매가(억)"
                value={s.saleMeso}
                placeholder="45"
                comma
                onChange={(v) => onPatch(s.id, { saleMeso: v })}
              />
              <NumberField
                label="개수"
                value={s.qty}
                placeholder="10"
                onChange={(v) => onPatch(s.id, { qty: v })}
              />
              <div className="sim-cell">
                <span className="sim-cap">판매메소</span>
                <div className="calc-value">{meso > 0 ? `${eok(meso)}억` : '-'}</div>
              </div>
              <button
                type="button"
                className="sim-del"
                onClick={() => onRemove(s.id)}
                aria-label="이 판매 삭제"
                title="삭제"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* 합계 · 목표 대비 */}
      <div className="totals sim-totals">
        <span>
          캐시 사용 <b>{int(cashUsed)}</b> / 목표 {int(result.needCash)}
          <em className={`sim-tag ${Math.abs(cashDiff) <= result.needCash * 0.01 ? 'ok' : 'warn'}`}>
            {Math.abs(cashDiff) <= result.needCash * 0.01
              ? '≈ 일치'
              : cashDiff < 0
                ? `${int(-cashDiff)} 부족`
                : `${int(cashDiff)} 초과`}
          </em>
        </span>
        <span>
          크레딧 사용 <b>{int(creditUsed)}</b> / 가용 {int(result.creditAvailable)}
          {creditOver && <em className="sim-tag warn">초과</em>}
        </span>
        <span>
          총 판매메소<b>{eok(mesoRaw)}억</b>
        </span>
        <span>
          회수 현금<b>{won(result.cashBack)}</b>
        </span>
        <span>
          실제 비용<b>{won(result.cost)}</b>
        </span>
      </div>
    </>
  );
}
