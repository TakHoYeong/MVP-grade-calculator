import type { CalcState, ItemRow } from './types';

/** 행 추가·초기화에 쓰는 id 생성기 */
let seq = 0;
export function newId(prefix = 'r'): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

export function emptyItem(): ItemRow {
  return { id: newId('i'), name: '', unitCost: null, saleMeso: null };
}

/**
 * 처음 열었을 때 채워지는 값.
 * 캐시아이템·크레딧아이템 시세는 예시이며, 실제 시세로 바꿔서 쓰는 것을 전제로 한다.
 */
export function createDefaultState(): CalcState {
  return {
    grade: 'black',
    alreadyCash: null,
    pcHours: null,
    tiers: [
      { id: newId('t'), limit: 600_000, discount: 6, earn: 0 },
      { id: newId('t'), limit: 300_000, discount: 0, earn: 0 },
      { id: newId('t'), limit: 1_600_000, discount: 1, earn: 2 },
    ],
    cashItems: [{ id: newId('i'), name: '99,000원 아이템', unitCost: 99_000, saleMeso: 49.8 }],
    creditItems: [{ id: newId('i'), name: '20,000크레딧 아이템', unitCost: 20_000, saleMeso: 17 }],
    feeRate: 3,
    exRate: 1_550,
  };
}
