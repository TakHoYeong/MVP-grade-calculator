import { CREDIT_EARN_RATE, PC_CASH_PER_HOUR, WEEKS } from './grades';
import type { CalcResult, CalcState, CashTier, ItemRow, ItemYield, TierFill } from './types';

/**
 * 계산 로직 전체. 모두 순수 함수이므로 UI 없이 테스트할 수 있다.
 *
 * 흐름
 *   ① 필요 캐시 = 등급 기준 − 이미 누적 − PC방 환산
 *   ② 순지출   = 필요 캐시를 조건 한도에 순서대로 채운 결제액 − 적립액
 *   ③ 판매메소 = 캐시아이템 + 크레딧아이템
 *   ④ 회수현금 = 판매메소 × (1 − 수수료) × 환전시세
 *   ⑤ 실제비용 = ② − ④
 */

/** null·빈 문자열·NaN 을 0 으로 흡수한다 */
export function n(v: number | null | undefined): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/**
 * 아이템 효율 = 판매메소(억) ÷ (필요재화 ÷ 10,000)
 * 즉 "1만 단위 재화당 몇 억 메소를 뽑는가".
 * 재화 종류가 달라도 같은 식으로 비교할 수 있고, 값이 클수록 유리하다.
 * 입력이 비어 있으면 null (비교 대상에서 제외).
 */
export function efficiency(row: ItemRow): number | null {
  const cost = n(row.unitCost);
  if (cost <= 0 || row.saleMeso === null || !Number.isFinite(n(row.saleMeso))) return null;
  return n(row.saleMeso) / (cost / 10_000);
}

/** 효율이 가장 높은 항목. 비교 가능한 항목이 없으면 null */
export function bestItem(rows: ItemRow[]): { row: ItemRow; efficiency: number } | null {
  let best: { row: ItemRow; efficiency: number } | null = null;
  for (const row of rows) {
    const eff = efficiency(row);
    if (eff === null) continue;
    if (best === null || eff > best.efficiency) best = { row, efficiency: eff };
  }
  return best;
}

/**
 * 필요 캐시를 구매 조건 한도에 위에서부터 채운다.
 * limit 이 null 또는 0 이하인 조건은 무제한으로 보고 나머지를 모두 흡수한다.
 * 모든 조건에 한도가 있고 합계가 부족하면, 남는 금액(overflow)은 할인 없이 계산한다.
 */
export function fillTiers(
  needCash: number,
  tiers: CashTier[],
): { fills: TierFill[]; paid: number; earned: number; overflow: number } {
  let remain = Math.max(0, needCash);
  let paid = 0;
  let earned = 0;
  const fills: TierFill[] = [];

  for (const tier of tiers) {
    const limit = tier.limit !== null && n(tier.limit) > 0 ? n(tier.limit) : Infinity;
    const used = Math.max(0, Math.min(remain, limit));
    const tierPaid = used * (1 - n(tier.discount) / 100);
    const tierEarned = tierPaid * (n(tier.earn) / 100);

    fills.push({ tierId: tier.id, used, paid: tierPaid });
    paid += tierPaid;
    earned += tierEarned;
    remain -= used;
  }

  const overflow = Math.max(0, remain);
  if (overflow > 0) paid += overflow; // 할인 조건이 없는 몫

  return { fills, paid, earned, overflow };
}

/** 주어진 재화 예산으로 최고 효율 아이템을 몇 개 사서 얼마의 메소를 얻는가 */
export function itemYield(budget: number, rows: ItemRow[]): ItemYield {
  const best = bestItem(rows);
  if (!best || n(best.row.unitCost) <= 0) {
    return { best: null, bestEfficiency: null, count: 0, meso: 0 };
  }
  // 아이템은 정수 개수만 살 수 있다 — 0.5개는 없으므로 내림한다.
  const count = Math.floor(budget / n(best.row.unitCost));
  return {
    best: best.row,
    bestEfficiency: best.efficiency,
    count,
    meso: count * n(best.row.saleMeso),
  };
}

/**
 * 목표 등급 하나에 대한 계산.
 *
 * @param targetCash 등급 기준 캐시
 * @param feePct     적용할 판매 수수료(%)
 * @param already    이미 누적된 캐시. 0 을 주면 '누적 0에서 한 바퀴' = 유지 비용 기준이 된다.
 */
export function calculate(
  state: CalcState,
  targetCash: number,
  feePct: number,
  already: number,
): CalcResult {
  const pcCash = n(state.pcHours) * PC_CASH_PER_HOUR * WEEKS;
  const needCash = Math.max(0, targetCash - Math.max(0, already) - pcCash);

  const { fills, paid, earned, overflow } = fillTiers(needCash, state.tiers);
  const spend = paid - earned;

  const cash = itemYield(needCash, state.cashItems);
  const creditEarned = needCash * (CREDIT_EARN_RATE / 100);
  const credit = itemYield(creditEarned, state.creditItems);

  const meso = cash.meso + credit.meso;
  const feeMultiplier = 1 - feePct / 100;
  const mesoAfterFee = meso * feeMultiplier;
  const cashBack = mesoAfterFee * n(state.exRate);
  const cost = spend - cashBack;

  return {
    targetCash,
    pcCash,
    needCash,
    fills,
    overflow,
    paid,
    earned,
    spend,
    costPerCash: needCash > 0 ? spend / needCash : 0,
    cash,
    creditEarned,
    credit,
    meso,
    mesoAfterFee,
    cashBack,
    cost,
    recovery: spend > 0 ? cashBack / spend : 0,
    breakEvenSale: breakEvenSale({ spend, needCash, feeMultiplier, exRate: n(state.exRate), credit, cash }),
  };
}

/**
 * 캐시아이템이 몇 억에 팔려야 실제 비용이 0이 되는가.
 * 크레딧아이템 수익과 환전 시세는 그대로 두고 캐시아이템 시세만 움직인다고 본다.
 */
function breakEvenSale(args: {
  spend: number;
  needCash: number;
  feeMultiplier: number;
  exRate: number;
  credit: ItemYield;
  cash: ItemYield;
}): number | null {
  const { spend, feeMultiplier, exRate, credit, cash } = args;
  if (!cash.best || cash.count <= 0 || exRate <= 0 || feeMultiplier <= 0) return null;
  const requiredMeso = spend / exRate / feeMultiplier;
  return (requiredMeso - credit.meso) / cash.count;
}
