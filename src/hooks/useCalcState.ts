import { useCallback, useEffect, useState } from 'react';
import { createDefaultState, emptyItem, newId } from '../lib/defaults';
import { clearState, loadState, saveState } from '../lib/storage';
import type { CalcState, CashTier, GradeKey, ItemRow, SaleRow } from '../lib/types';

/** 아이템 표 세 종류를 가리키는 키 */
type ItemListKey = 'cashItems' | 'creditItems';

/**
 * 계산기 입력 상태를 관리한다.
 * 변경이 있을 때마다 localStorage 에 저장하고, 처음 열 때 복원한다.
 */
export function useCalcState() {
  const [state, setState] = useState<CalcState>(() => loadState() ?? createDefaultState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const patch = useCallback((p: Partial<CalcState>) => {
    setState((prev) => ({ ...prev, ...p }));
  }, []);

  // 수수료는 등급이 아니라 수령 방식(실버 이상·PC방)에 달렸으므로, 등급을 바꿔도 건드리지 않는다.
  const setGrade = useCallback((grade: GradeKey) => {
    setState((prev) => ({ ...prev, grade }));
  }, []);

  const patchTier = useCallback((id: string, p: Partial<CashTier>) => {
    setState((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t) => (t.id === id ? { ...t, ...p } : t)),
    }));
  }, []);

  const addTier = useCallback((init?: Partial<Pick<CashTier, 'limit' | 'discount' | 'earn'>>) => {
    setState((prev) => ({
      ...prev,
      tiers: [
        ...prev.tiers,
        {
          id: newId('t'),
          limit: init?.limit ?? null,
          discount: init?.discount ?? null,
          earn: init?.earn ?? null,
        },
      ],
    }));
  }, []);

  const removeTier = useCallback((id: string) => {
    setState((prev) => ({ ...prev, tiers: prev.tiers.filter((t) => t.id !== id) }));
  }, []);

  const patchItem = useCallback((list: ItemListKey, id: string, p: Partial<ItemRow>) => {
    setState((prev) => ({
      ...prev,
      [list]: prev[list].map((row) => (row.id === id ? { ...row, ...p } : row)),
    }));
  }, []);

  const addItem = useCallback((list: ItemListKey) => {
    setState((prev) => ({ ...prev, [list]: [...prev[list], emptyItem()] }));
  }, []);

  const removeItem = useCallback((list: ItemListKey, id: string) => {
    setState((prev) => ({ ...prev, [list]: prev[list].filter((row) => row.id !== id) }));
  }, []);

  const patchSale = useCallback((id: string, p: Partial<SaleRow>) => {
    setState((prev) => ({
      ...prev,
      sales: prev.sales.map((row) => (row.id === id ? { ...row, ...p } : row)),
    }));
  }, []);

  const addSale = useCallback(
    (init?: Partial<Pick<SaleRow, 'kind' | 'unitCost' | 'saleMeso' | 'qty'>>) => {
      setState((prev) => ({
        ...prev,
        sales: [
          ...prev.sales,
          {
            id: newId('s'),
            kind: init?.kind ?? 'cash',
            unitCost: init?.unitCost ?? null,
            saleMeso: init?.saleMeso ?? null,
            qty: init?.qty ?? null,
          },
        ],
      }));
    },
    [],
  );

  const removeSale = useCallback((id: string) => {
    setState((prev) => ({ ...prev, sales: prev.sales.filter((row) => row.id !== id) }));
  }, []);

  // 2번 효율표(캐시·크레딧 아이템)를 3번 판매 시뮬 행으로 복사한다.
  // 값(종류·가격·판매메소)이 이미 있는 항목은 건너뛰고, 개수는 비워 둔다(사용자가 채움).
  const importItemsToSales = useCallback(() => {
    setState((prev) => {
      const key = (kind: SaleRow['kind'], unitCost: number | null, saleMeso: number | null) =>
        `${kind}|${unitCost}|${saleMeso}`;
      const seen = new Set(prev.sales.map((s) => key(s.kind, s.unitCost, s.saleMeso)));
      const collect = (rows: ItemRow[], kind: SaleRow['kind']): SaleRow[] => {
        const out: SaleRow[] = [];
        for (const r of rows) {
          if (typeof r.unitCost !== 'number' || r.unitCost <= 0 || r.saleMeso === null) continue;
          const k = key(kind, r.unitCost, r.saleMeso);
          if (seen.has(k)) continue;
          seen.add(k);
          out.push({ id: newId('s'), kind, unitCost: r.unitCost, saleMeso: r.saleMeso, qty: null });
        }
        return out;
      };
      const added = [...collect(prev.cashItems, 'cash'), ...collect(prev.creditItems, 'credit')];
      return added.length ? { ...prev, sales: [...prev.sales, ...added] } : prev;
    });
  }, []);

  const reset = useCallback(() => {
    clearState();
    setState(createDefaultState());
  }, []);

  return {
    state,
    patch,
    setGrade,
    patchTier,
    addTier,
    removeTier,
    patchItem,
    addItem,
    removeItem,
    patchSale,
    addSale,
    removeSale,
    importItemsToSales,
    reset,
  };
}
