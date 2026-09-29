import { CREDIT_EARN_RATE, PC_CASH_PER_HOUR, WEEKS } from './grades';
import type { CalcResult, CalcState, CashTier, SaleRow, SaleTotals, TierFill } from './types';

/**
 * 계산 로직 전체. 모두 순수 함수이므로 UI 없이 테스트할 수 있다.
 *
 * 흐름
 *   ① 필요 캐시 = 등급 기준 − 이미 누적 − PC방 환산
 *   ② 순지출   = 필요 캐시를 조건 한도에 순서대로 채운 결제액 − 적립액
 *   ③ 재판매   = 판매 시뮬레이션에 입력한 계획 그대로의 판매 메소
 *   ④ 회수현금 = 판매 메소 × (1 − 수수료) × 환전시세
 *   ⑤ 실제비용 = ② − ④
 *
 * 기본은 '입력한 판매 계획 그대로' 계산한다(개수를 바꾸면 회수도 바뀐다).
 * 등급별 비교표만 opts.scaleRecovery 로 효율을 각 등급 목표에 맞춰 환산한 '예상'을 쓴다.
 */

/** null·빈 문자열·NaN 을 0 으로 흡수한다 */
export function n(v: number | null | undefined): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/**
 * 판매 효율 = 판매메소(억) ÷ (필요재화 ÷ 10,000)
 * 즉 "1만 단위 재화당 몇 억 메소를 뽑는가". (판매 행끼리 비교용)
 * 입력이 비어 있으면 null (비교 대상에서 제외).
 */
export function efficiency(row: { unitCost: number | null; saleMeso: number | null }): number | null {
  const cost = n(row.unitCost);
  if (cost <= 0 || row.saleMeso === null || !Number.isFinite(n(row.saleMeso))) return null;
  return n(row.saleMeso) / (cost / 10_000);
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

/** 판매 시뮬레이션을 종류별로 집계한다 (수수료·시세 적용 전) */
export function sumSales(sales: SaleRow[]): SaleTotals {
  let cashUsed = 0;
  let creditUsed = 0;
  let cashMeso = 0;
  let creditMeso = 0;
  for (const s of sales) {
    const spent = n(s.unitCost) * n(s.qty);
    const meso = n(s.saleMeso) * n(s.qty);
    if (s.kind === 'credit') {
      creditUsed += spent;
      creditMeso += meso;
    } else {
      cashUsed += spent;
      cashMeso += meso;
    }
  }
  return { cashUsed, creditUsed, cashMeso, creditMeso, mesoRaw: cashMeso + creditMeso };
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
  opts?: { scaleRecovery?: boolean },
): CalcResult {
  const pcCash = n(state.pcHours) * PC_CASH_PER_HOUR * WEEKS;
  const needCash = Math.max(0, targetCash - Math.max(0, already) - pcCash);

  const { fills, paid, earned, overflow } = fillTiers(needCash, state.tiers);
  const spend = paid - earned;

  const sale = sumSales(state.sales);

  // 크레딧 아이템은 '가용 크레딧'(needCash 의 5%)만큼만 살 수 있다.
  // 그 이상 입력됐으면 실제로는 다 살 수 없으므로, 초과분 회수는 비례해서 깎는다.
  const creditAvailable = needCash * (CREDIT_EARN_RATE / 100);
  const creditMeso =
    sale.creditUsed > creditAvailable && sale.creditUsed > 0
      ? sale.creditMeso * (creditAvailable / sale.creditUsed)
      : sale.creditMeso;
  const effectiveMeso = sale.cashMeso + creditMeso;

  // 기본: 입력한 판매 계획 그대로(크레딧 상한 반영).
  // scaleRecovery(등급 비교표): 캐시 1원당 효율을 이 등급 needCash 로 환산한 '예상'.
  const meso = opts?.scaleRecovery
    ? sale.cashUsed > 0
      ? (effectiveMeso / sale.cashUsed) * needCash
      : 0
    : effectiveMeso;

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
    sale,
    creditAvailable,
    meso,
    mesoAfterFee,
    cashBack,
    cost,
    recovery: spend > 0 ? cashBack / spend : 0,
  };
}
