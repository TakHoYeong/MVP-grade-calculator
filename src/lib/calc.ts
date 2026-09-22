import { CREDIT_EARN_RATE, PC_CASH_PER_HOUR, WEEKS } from './grades';
import type { CalcResult, CalcState, CashTier, ItemRow, SaleRow, SaleTotals, TierFill } from './types';

/**
 * 계산 로직 전체. 모두 순수 함수이므로 UI 없이 테스트할 수 있다.
 *
 * 흐름
 *   ① 필요 캐시 = 등급 기준 − 이미 누적 − PC방 환산
 *   ② 순지출   = 필요 캐시를 조건 한도에 순서대로 채운 결제액 − 적립액
 *   ③ 재판매   = 판매 시뮬레이션(3번)이 정의한 "캐시 1원당 판매 메소" 효율
 *   ④ 회수현금 = (효율 × 필요 캐시) × (1 − 수수료) × 환전시세
 *   ⑤ 실제비용 = ② − ④
 *
 * 2번 '판매 효율 비교'는 어떤 아이템이 유리한지 눈으로 보는 참고용이고,
 * 실제 회수/비용은 3번 판매 시뮬레이션 입력만으로 계산한다.
 */

/** null·빈 문자열·NaN 을 0 으로 흡수한다 */
export function n(v: number | null | undefined): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/**
 * 아이템 효율 = 판매메소(억) ÷ (필요재화 ÷ 10,000)
 * 즉 "1만 단위 재화당 몇 억 메소를 뽑는가". (2번 표에서 비교용으로만 쓴다)
 * 입력이 비어 있으면 null (비교 대상에서 제외).
 */
export function efficiency(row: ItemRow): number | null {
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
  let mesoRaw = 0;
  for (const s of sales) {
    const spent = n(s.unitCost) * n(s.qty);
    mesoRaw += n(s.saleMeso) * n(s.qty);
    if (s.kind === 'credit') creditUsed += spent;
    else cashUsed += spent;
  }
  return { cashUsed, creditUsed, mesoRaw };
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

  // 시뮬이 표현한 재판매 효율(캐시 1원당 판매 메소)을 이 등급 needCash 로 환산한다.
  // 캐시 사용액을 needCash 에 맞추면 입력한 판매 메소가 그대로 반영된다.
  const sale = sumSales(state.sales);
  const mesoPerCash = sale.cashUsed > 0 ? sale.mesoRaw / sale.cashUsed : 0;
  const meso = mesoPerCash * needCash;

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
    creditAvailable: needCash * (CREDIT_EARN_RATE / 100),
    meso,
    mesoAfterFee,
    cashBack,
    cost,
    recovery: spend > 0 ? cashBack / spend : 0,
  };
}
