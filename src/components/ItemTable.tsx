import { NumberField } from './NumberField';
import { efficiency } from '../lib/calc';
import { fixed } from '../lib/format';
import type { ItemRow } from '../lib/types';

interface Props {
  rows: ItemRow[];
  /** 재화 이름 — "캐시가격(원)" 처럼 열 제목에 쓰인다 */
  costLabel: string;
  /** 효율 열의 단위 설명 */
  effLabel: string;
  onPatch: (id: string, patch: Partial<ItemRow>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

const COLS = 'minmax(104px, 1.4fr) 1fr 1fr minmax(118px, 1.3fr) 32px';

/**
 * 판매 효율 비교표.
 * 효율이 가장 높은 행에 ★ 와 강조색이 붙는다 (비교 대상이 둘 이상일 때만).
 */
export function ItemTable({ rows, costLabel, effLabel, onPatch, onRemove, onAdd }: Props) {
  const effs = rows.map(efficiency);
  const max = effs.reduce<number>((acc, e) => (e !== null && e > acc ? e : acc), 0);
  const bestIndex = effs.findIndex((e) => e !== null && e === max && max > 0);

  return (
    <>
      <div className="rows" style={{ ['--cols' as string]: COLS }}>
        <div className="head-row" aria-hidden="true">
          <span>아이템명</span>
          <span>{costLabel}</span>
          <span>판매메소(억)</span>
          <span>효율 {effLabel}</span>
          <span />
        </div>

        {rows.map((row, i) => {
          const eff = effs[i];
          const isBest = i === bestIndex && rows.length > 1;
          const width = eff !== null && max > 0 ? Math.max(6, (eff / max) * 100) : 0;
          return (
            <div key={row.id} className={`row${isBest ? ' is-best' : ''}`}>
              <div className="cell-name">
                <label className="field-label" htmlFor={`item-name-${row.id}`}>
                  아이템명
                </label>
                <input
                  id={`item-name-${row.id}`}
                  className="txt"
                  type="text"
                  value={row.name}
                  placeholder="이름"
                  aria-label="아이템명"
                  onChange={(e) => onPatch(row.id, { name: e.target.value })}
                />
              </div>

              <div className="fields">
                <NumberField
                  label={costLabel}
                  value={row.unitCost}
                  comma
                  onChange={(v) => onPatch(row.id, { unitCost: v })}
                />
                <NumberField
                  label="판매메소(억)"
                  value={row.saleMeso}
                  placeholder="시세 입력"
                  comma
                  onChange={(v) => onPatch(row.id, { saleMeso: v })}
                />
              </div>

              <div>
                <span className="field-label">효율 {effLabel}</span>
                <div className="eff">
                  <span className="eff-star" aria-hidden="true">
                    {isBest ? '★' : ''}
                  </span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${width}%` }} />
                  </div>
                  <span className="eff-val">{eff !== null ? fixed(eff, 2) : '-'}</span>
                  {isBest && <span className="sr-only">최고 효율</span>}
                </div>
              </div>

              <button
                type="button"
                className="del"
                onClick={() => onRemove(row.id)}
                aria-label={`${row.name || '아이템'} 삭제`}
                title="삭제"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className="add-row" onClick={onAdd}>
        + 아이템 추가
      </button>
    </>
  );
}
