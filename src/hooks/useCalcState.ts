import { useCallback, useEffect, useState } from 'react';
import { createDefaultState, newId } from '../lib/defaults';
import { suggestSaleMix } from '../lib/saleItems';
import { clearState, loadState, saveState } from '../lib/storage';
import type { CalcState, CashTier, GradeKey, SaleRow } from '../lib/types';

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

  // 목표 캐시에 맞춰 대표 상품을 적절히 섞어 판매 목록을 새로 채운다(기존 목록은 대체).
  const autoFillSales = useCallback((needCash: number) => {
    const rows: SaleRow[] = suggestSaleMix(needCash).map(({ item, qty }) => ({
      id: newId('s'),
      kind: item.kind,
      unitCost: item.unitCost,
      saleMeso: item.saleMeso,
      qty,
    }));
    if (rows.length === 0) return;
    setState((prev) => ({ ...prev, sales: rows }));
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
    patchSale,
    addSale,
    removeSale,
    autoFillSales,
    reset,
  };
}
