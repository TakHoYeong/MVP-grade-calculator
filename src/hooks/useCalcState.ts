import { useCallback, useEffect, useState } from 'react';
import { createDefaultState, emptyItem, newId } from '../lib/defaults';
import { findGrade } from '../lib/grades';
import { clearState, loadState, saveState } from '../lib/storage';
import type { CalcState, CashTier, GradeKey, ItemRow } from '../lib/types';

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

  /** 등급을 바꾸면 그 등급의 기본 옥션 수수료로 함께 맞춘다 */
  const setGrade = useCallback((grade: GradeKey) => {
    setState((prev) => ({ ...prev, grade, feeRate: findGrade(grade).fee }));
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
    reset,
  };
}
