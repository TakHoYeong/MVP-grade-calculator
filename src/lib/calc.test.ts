import { describe, expect, it } from 'vitest';
import { calculate, efficiency, fillTiers, n, sumSales } from './calc';
import { createDefaultState, newId } from './defaults';
import { findGrade } from './grades';
import type { CalcState, ItemRow, SaleRow } from './types';

/** 기본 상태 위에 일부만 덮어쓴다 */
function state(patch: Partial<CalcState> = {}): CalcState {
  return { ...createDefaultState(), ...patch };
}
function item(unitCost: number | null, saleMeso: number | null, name = ''): ItemRow {
  return { id: newId('test'), name, unitCost, saleMeso };
}
function sale(
  kind: SaleRow['kind'],
  unitCost: number | null,
  saleMeso: number | null,
  qty: number | null,
): SaleRow {
  return { id: newId('s'), kind, unitCost, saleMeso, qty };
}

describe('n', () => {
  it('null·NaN 을 0 으로 흡수한다', () => {
    expect(n(null)).toBe(0);
    expect(n(undefined)).toBe(0);
    expect(n(Number.NaN)).toBe(0);
    expect(n(5)).toBe(5);
  });
});

describe('efficiency', () => {
  it('1만 단위 재화당 억 메소로 환산한다 (2번 비교용)', () => {
    expect(efficiency(item(99_000, 49.8))).toBeCloseTo(5.0303, 4);
    expect(efficiency(item(20_000, 17))).toBeCloseTo(8.5, 4);
  });

  it('입력이 비었거나 0이면 제외한다', () => {
    expect(efficiency(item(null, 10))).toBeNull();
    expect(efficiency(item(10_000, null))).toBeNull();
    expect(efficiency(item(0, 10))).toBeNull();
  });
});

describe('fillTiers', () => {
  const tiers = createDefaultState().tiers;

  it('한도를 위에서부터 채우고 마지막 구간이 나머지를 흡수한다', () => {
    const r = fillTiers(2_500_000, tiers);
    expect(r.fills.map((f) => f.used)).toEqual([600_000, 300_000, 1_600_000]);
    expect(r.paid).toBe(2_448_000);
    expect(r.earned).toBeCloseTo(31_680, 6);
    expect(r.overflow).toBe(0);
  });

  it('필요 금액이 적으면 앞쪽 조건만 사용한다', () => {
    const r = fillTiers(300_000, tiers);
    expect(r.fills.map((f) => f.used)).toEqual([300_000, 0, 0]);
    expect(r.paid).toBe(282_000);
  });

  it('모든 조건에 한도가 있고 부족하면 남는 금액을 할인 없이 계산한다', () => {
    const capped = tiers.map((t, i) => (i === tiers.length - 1 ? { ...t, limit: 100_000 } : t));
    const r = fillTiers(1_100_000, capped);
    expect(r.overflow).toBe(100_000);
    expect(r.paid).toBe(564_000 + 300_000 + 99_000 + 100_000);
  });

  it('필요 금액이 0이면 아무 조건도 사용하지 않는다', () => {
    const r = fillTiers(0, tiers);
    expect(r.paid).toBe(0);
    expect(r.fills.every((f) => f.used === 0)).toBe(true);
  });
});

describe('sumSales', () => {
  it('종류별로 사용액과 판매메소를 합산한다', () => {
    const r = sumSales([
      sale('cash', 100_000, 50, 20),
      sale('credit', 10_000, 8, 5),
      sale('cash', 50_000, 22, 4),
    ]);
    expect(r.cashUsed).toBe(100_000 * 20 + 50_000 * 4);
    expect(r.creditUsed).toBe(10_000 * 5);
    expect(r.mesoRaw).toBeCloseTo(50 * 20 + 8 * 5 + 22 * 4, 6);
  });

  it('빈 목록은 0', () => {
    expect(sumSales([])).toEqual({ cashUsed: 0, creditUsed: 0, mesoRaw: 0 });
  });
});

describe('calculate — 판매 시뮬 기준', () => {
  // 순수 시나리오: 단일 무제한 조건(할인 0) → 순지출 = 필요캐시
  const base = (): CalcState =>
    state({
      alreadyCash: null,
      pcHours: null,
      tiers: [{ id: newId('t'), limit: null, discount: 0, earn: 0 }],
      sales: [],
      feeRate: 3,
      exRate: 1_000,
    });

  it('시뮬 캐시 사용액이 필요캐시와 같으면 입력한 판매메소가 그대로 반영된다', () => {
    const s: CalcState = { ...base(), sales: [sale('cash', 100_000, 50, 10)] };
    const r = calculate(s, 1_000_000, 3, 0);
    expect(r.needCash).toBe(1_000_000);
    expect(r.spend).toBe(1_000_000);
    expect(r.sale.cashUsed).toBe(1_000_000);
    expect(r.meso).toBeCloseTo(500, 6); // 50 × 10
    expect(r.cashBack).toBeCloseTo(485_000, 2); // 500 × 0.97 × 1000
    expect(r.cost).toBeCloseTo(515_000, 2);
    expect(r.recovery).toBeCloseTo(0.485, 4);
  });

  it('수량이 절반이어도 캐시당 메소 효율로 환산해 같은 회수가 된다', () => {
    const s: CalcState = { ...base(), sales: [sale('cash', 100_000, 50, 5)] };
    const r = calculate(s, 1_000_000, 3, 0);
    expect(r.sale.cashUsed).toBe(500_000);
    expect(r.meso).toBeCloseTo(500, 6); // (250 / 500,000) × 1,000,000
    expect(r.cashBack).toBeCloseTo(485_000, 2);
  });

  it('크레딧 판매도 회수에 포함된다', () => {
    const s: CalcState = {
      ...base(),
      sales: [sale('cash', 100_000, 50, 10), sale('credit', 10_000, 8, 5)],
    };
    const r = calculate(s, 1_000_000, 3, 0);
    expect(r.sale.creditUsed).toBe(50_000);
    expect(r.creditAvailable).toBeCloseTo(50_000, 6); // 1,000,000 의 5%
    expect(r.meso).toBeCloseTo(540, 6); // (500 + 40) / 1,000,000 × 1,000,000
    expect(r.cashBack).toBeCloseTo(523_800, 2);
    expect(r.cost).toBeCloseTo(476_200, 2);
  });

  it('판매 시뮬이 비면 회수 0, 비용 = 순지출', () => {
    const r = calculate(base(), 1_000_000, 3, 0);
    expect(r.meso).toBe(0);
    expect(r.cashBack).toBe(0);
    expect(r.cost).toBe(1_000_000);
    expect(r.recovery).toBe(0);
  });

  it('낮은 등급일수록 필요 캐시와 총 비용이 적다', () => {
    const s = state();
    const silver = calculate(s, findGrade('silver').req, findGrade('silver').fee, 0);
    const black = calculate(s, findGrade('black').req, findGrade('black').fee, 0);
    expect(silver.needCash).toBeLessThan(black.needCash);
    expect(silver.cost).toBeLessThan(black.cost);
  });
});

describe('빈 입력 방어', () => {
  it('모든 값이 비어도 예외 없이 계산된다', () => {
    const empty = state({
      alreadyCash: null,
      pcHours: null,
      tiers: [],
      cashItems: [],
      creditItems: [],
      sales: [],
      feeRate: null,
      exRate: null,
    });
    const r = calculate(empty, 2_500_000, 0, 0);
    expect(r.spend).toBe(2_500_000); // 할인 조건이 없으니 액면 그대로
    expect(r.cashBack).toBe(0);
    expect(Number.isFinite(r.cost)).toBe(true);
  });
});
