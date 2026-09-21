import { describe, expect, it } from 'vitest';
import { bestItem, calcMaplePoint, calculate, efficiency, fillTiers, itemYield } from './calc';
import { createDefaultState, newId } from './defaults';
import { findGrade } from './grades';
import type { CalcState, ItemRow } from './types';

/** 기본 상태 위에 일부만 덮어쓴다 */
function state(patch: Partial<CalcState> = {}): CalcState {
  return { ...createDefaultState(), ...patch };
}
function item(unitCost: number | null, saleMeso: number | null, name = ''): ItemRow {
  return { id: newId('test'), name, unitCost, saleMeso };
}

describe('efficiency', () => {
  it('1만 단위 재화당 억 메소로 환산한다', () => {
    // 99,000캐시로 49.8억 → 1만원당 5.0303억
    expect(efficiency(item(99_000, 49.8))).toBeCloseTo(5.0303, 4);
    expect(efficiency(item(20_000, 17))).toBeCloseTo(8.5, 4);
  });

  it('입력이 비었거나 0이면 비교 대상에서 제외한다', () => {
    expect(efficiency(item(null, 10))).toBeNull();
    expect(efficiency(item(10_000, null))).toBeNull();
    expect(efficiency(item(0, 10))).toBeNull();
  });
});

describe('bestItem', () => {
  it('효율이 가장 높은 항목을 고른다', () => {
    const rows = [item(99_000, 49.8, 'A'), item(50_000, 30, 'B'), item(10_000, 4, 'C')];
    // A 5.03 · B 6.00 · C 4.00
    expect(bestItem(rows)?.row.name).toBe('B');
  });

  it('비교 가능한 항목이 없으면 null', () => {
    expect(bestItem([item(null, null), item(0, 5)])).toBeNull();
  });
});

describe('fillTiers', () => {
  const tiers = createDefaultState().tiers;

  it('한도를 위에서부터 채우고 마지막 무제한 조건이 나머지를 흡수한다', () => {
    const r = fillTiers(2_500_000, tiers);
    expect(r.fills.map((f) => f.used)).toEqual([600_000, 300_000, 1_600_000]);
    // 600,000×0.94 + 300,000 + 1,600,000×0.99
    expect(r.paid).toBe(2_448_000);
    // 1,600,000×0.99 의 2%
    expect(r.earned).toBeCloseTo(31_680, 6);
    expect(r.overflow).toBe(0);
  });

  it('필요 금액이 적으면 앞쪽 조건만 사용한다', () => {
    const r = fillTiers(300_000, tiers);
    expect(r.fills.map((f) => f.used)).toEqual([300_000, 0, 0]);
    expect(r.paid).toBe(282_000); // 6% 할인만 적용
  });

  it('모든 조건에 한도가 있고 부족하면 남는 금액을 할인 없이 계산한다', () => {
    const capped = tiers.map((t) => ({ ...t, limit: t.limit ?? 100_000 }));
    const r = fillTiers(1_100_000, capped);
    expect(r.overflow).toBe(100_000);
    // 600,000×0.94 + 300,000 + 100,000×0.99 + 100,000(할인 없음)
    expect(r.paid).toBe(564_000 + 300_000 + 99_000 + 100_000);
  });

  it('필요 금액이 0이면 아무 조건도 사용하지 않는다', () => {
    const r = fillTiers(0, tiers);
    expect(r.paid).toBe(0);
    expect(r.earned).toBe(0);
    expect(r.fills.every((f) => f.used === 0)).toBe(true);
  });
});

describe('itemYield', () => {
  it('예산으로 최고 효율 아이템을 사서 얻는 메소를 구한다', () => {
    const y = itemYield(2_500_000, [item(99_000, 49.8)]);
    expect(y.count).toBeCloseTo(25.2525, 4);
    expect(y.meso).toBeCloseTo(1_257.5758, 3);
  });

  it('비교 가능한 아이템이 없으면 0을 돌려준다', () => {
    const y = itemYield(1_000_000, [item(null, null)]);
    expect(y.best).toBeNull();
    expect(y.meso).toBe(0);
  });
});

describe('calculate — 블랙 기준 시나리오', () => {
  const s = state();
  const black = findGrade('black');

  it('누적 0에서 블랙을 달면 실제 비용이 365,808원이다', () => {
    const r = calculate(s, black.req, black.fee, 0);
    expect(r.needCash).toBe(2_500_000);
    expect(r.spend).toBeCloseTo(2_416_320, 6);
    expect(r.cash.meso).toBeCloseTo(1_257.5758, 3);
    expect(r.credit.meso).toBeCloseTo(106.25, 6);
    expect(r.cashBack).toBeCloseTo(2_050_512.03, 2);
    expect(r.cost).toBeCloseTo(365_807.97, 2);
    expect(r.recovery).toBeCloseTo(0.8486, 4);
  });

  it('이미 32만이 누적되어 있으면 남은 금액만 계산한다', () => {
    const r = calculate(state({ alreadyCash: 320_000 }), black.req, black.fee, 320_000);
    expect(r.needCash).toBe(2_180_000);
    expect(r.cost).toBeCloseTo(317_809.51, 2);
    // 마지막 무제한 조건이 줄어든 만큼만 흡수한다
    expect(r.fills.map((f) => f.used)).toEqual([600_000, 300_000, 1_280_000]);
  });

  it('PC방 주당 10시간은 13만 캐시를 대신 채운다', () => {
    const r = calculate(state({ pcHours: 10 }), black.req, black.fee, 0);
    expect(r.pcCash).toBe(130_000);
    expect(r.needCash).toBe(2_370_000);
    expect(r.cost).toBeLessThan(365_808);
  });

  it('손익분기 시세는 현재 시세보다 높다', () => {
    const r = calculate(s, black.req, black.fee, 0);
    expect(r.breakEvenSale).toBeCloseTo(59.4348, 3);
  });
});

describe('calculate — 등급별 비교', () => {
  it('낮은 등급은 좋은 할인 구간 안에서 해결되어 회수율이 더 높다', () => {
    const s = state();
    const silver = calculate(s, findGrade('silver').req, findGrade('silver').fee, 0);
    const black = calculate(s, findGrade('black').req, findGrade('black').fee, 0);
    expect(silver.recovery).toBeGreaterThan(black.recovery);
    expect(silver.cost).toBeLessThan(black.cost);
  });

  it('브론즈는 수수료 5%가 적용되어 회수가 줄어든다', () => {
    const s = state();
    const bronze = findGrade('bronze');
    const withRealFee = calculate(s, bronze.req, bronze.fee, 0);
    const withSilverFee = calculate(s, bronze.req, 3, 0);
    expect(withRealFee.cashBack).toBeLessThan(withSilverFee.cashBack);
  });

  it('이미 목표를 넘겼으면 추가 비용이 0이다', () => {
    const silver = findGrade('silver');
    const r = calculate(state({ alreadyCash: 400_000 }), silver.req, silver.fee, 400_000);
    expect(r.needCash).toBe(0);
    expect(r.spend).toBe(0);
    expect(r.cost).toBe(0);
    expect(r.recovery).toBe(0);
  });
});

describe('calcMaplePoint', () => {
  it('보유 포인트로 살 수 있는 만큼만 계산한다', () => {
    const s = state({
      mpOwned: 500_000,
      mpItems: [item(100_000, 20, '10만 포인트 아이템')],
    });
    const r = calcMaplePoint(s, 3);
    expect(r.count).toBeCloseTo(5, 6);
    expect(r.meso).toBeCloseTo(100, 6);
    // 100억 × 0.97 × 1,550
    expect(r.cashBack).toBeCloseTo(150_350, 2);
  });

  it('시세를 입력하지 않으면 0이다', () => {
    const r = calcMaplePoint(state({ mpOwned: 500_000 }), 3);
    expect(r.cashBack).toBe(0);
  });
});

describe('빈 입력 방어', () => {
  it('모든 값이 비어도 예외 없이 0을 돌려준다', () => {
    const empty = state({
      alreadyCash: null,
      pcHours: null,
      tiers: [],
      cashItems: [],
      creditRate: null,
      creditItems: [],
      mpOwned: null,
      mpItems: [],
      feeRate: null,
      exRate: null,
    });
    const r = calculate(empty, 2_500_000, 0, 0);
    expect(r.spend).toBe(2_500_000); // 할인 조건이 없으니 액면 그대로
    expect(r.cashBack).toBe(0);
    expect(r.breakEvenSale).toBeNull();
    expect(Number.isFinite(r.cost)).toBe(true);
  });
});
