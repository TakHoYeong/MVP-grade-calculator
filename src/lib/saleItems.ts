import type { SaleKind } from './types';

export interface SaleItem {
  label: string;
  kind: SaleKind;
  /** 1개 캐시가격(원) 또는 필요 크레딧 */
  unitCost: number;
  /** 1개 판매 메소(억) */
  saleMeso: number;
}

/**
 * MVP 작업자들이 상시 판매하는 대표 상품.
 * 시세는 시점에 따라 달라질 수 있으니, 담은 뒤 판매가를 실제에 맞게 고쳐 쓴다.
 */
export const SALE_ITEMS: SaleItem[] = [
  { label: '위습의 원더베리 21개', kind: 'cash', unitCost: 100_000, saleMeso: 46.15 },
  { label: '위습의 원더베리 11개', kind: 'cash', unitCost: 54_000, saleMeso: 23.75 },
  { label: '위습의 원더베리 1개', kind: 'cash', unitCost: 5_400, saleMeso: 2.3 },
  { label: '루나 크리스탈', kind: 'cash', unitCost: 3_900, saleMeso: 1.8 },
];

/**
 * 목표 캐시(needCash)를 대표 상품으로 적절히 섞어 채운다.
 * - 큰 묶음(원더베리 21개)부터 채워 거래 횟수(노동력)를 줄이되,
 * - 한 상품이 목표의 절반을 넘지 않게 분산해 자가 시세 하락을 완화하고,
 * - 남는 금액은 가장 작은 단위로 채워 목표 이상이 되게 한다.
 * 어디까지나 시작점이며, 실제 시장 상황에 맞게 개수를 조정해 쓴다.
 */
export function suggestSaleMix(needCash: number): { item: SaleItem; qty: number }[] {
  const target = Math.max(0, needCash);
  if (target <= 0 || SALE_ITEMS.length === 0) return [];

  const byCostDesc = [...SALE_ITEMS].sort((a, b) => b.unitCost - a.unitCost);
  const smallest = byCostDesc[byCostDesc.length - 1];
  const cap = target * 0.5; // 한 상품 최대 사용 한도(목표의 50%)

  const out: { item: SaleItem; qty: number }[] = [];
  let remaining = target;

  // 가장 작은 상품은 마지막에 남는 금액을 채우므로 여기서는 제외한다
  for (const item of byCostDesc.slice(0, -1)) {
    if (remaining <= 0) break;
    const budget = Math.min(remaining, cap);
    const qty = Math.floor(budget / item.unitCost);
    if (qty > 0) {
      out.push({ item, qty });
      remaining -= qty * item.unitCost;
    }
  }

  // 남는 금액을 가장 작은 단위로 채워 목표 이상이 되게 한다
  if (remaining > 0) {
    const qty = Math.ceil(remaining / smallest.unitCost);
    const existing = out.find((o) => o.item === smallest);
    if (existing) existing.qty += qty;
    else out.push({ item: smallest, qty });
  }

  return out;
}
