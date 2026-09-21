/** MVP 등급 식별자 */
export type GradeKey = 'bronze' | 'silver' | 'gold' | 'diamond' | 'red' | 'black';

/** 등급 사양 */
export interface Grade {
  key: GradeKey;
  name: string;
  /** 이번 주 포함 최근 13주 누적 넥슨캐시 기준 */
  req: number;
  /** 해당 등급의 기본 메이플 옥션 판매 수수료(%) */
  fee: number;
}

/**
 * 넥슨캐시 구매 조건 한 줄.
 * limit 이 null 이면 '나머지 전부'로 취급한다.
 */
export interface CashTier {
  id: string;
  name: string;
  limit: number | null;
  /** 할인율(%) */
  discount: number | null;
  /** 결제액 대비 적립률(%) */
  earn: number | null;
}

/**
 * 판매 효율을 비교할 아이템 한 줄.
 * unitCost 의 단위는 종류에 따라 달라진다 — 캐시(원) · 크레딧 · 메이플포인트.
 */
export interface ItemRow {
  id: string;
  name: string;
  /** 1개를 사는 데 드는 재화 수량 */
  unitCost: number | null;
  /** 1개를 팔 때 받는 메소(억) */
  saleMeso: number | null;
}

/** 아이템 비교표 종류 */
export type ItemKind = 'cash' | 'credit' | 'mp';

/** 계산기 전체 입력 상태 */
export interface CalcState {
  grade: GradeKey;
  /** 최근 13주 동안 이미 사용한 넥슨캐시 */
  alreadyCash: number | null;
  /** 프리미엄PC방 주당 이용 시간 */
  pcHours: number | null;
  tiers: CashTier[];
  cashItems: ItemRow[];
  /** 캐시 사용액 대비 크레딧 적립률(%) */
  creditRate: number | null;
  creditItems: ItemRow[];
  /** 보유 메이플포인트 */
  mpOwned: number | null;
  mpItems: ItemRow[];
  /** 판매금 수령 수수료(%) */
  feeRate: number | null;
  /** 환전 시세: 원 / 1억 메소 */
  exRate: number | null;
}

/** 조건 한 줄이 실제로 얼마를 흡수했는지 */
export interface TierFill {
  tierId: string;
  /** 이 조건으로 구매한 캐시 */
  used: number;
  /** 그때 실제로 결제한 금액(원) */
  paid: number;
}

/** 아이템 한 종류를 팔아 얻는 결과 */
export interface ItemYield {
  best: ItemRow | null;
  /** 최고 효율 항목의 효율값 (1만 단위 재화당 억 메소) */
  bestEfficiency: number | null;
  count: number;
  meso: number;
}

/** 목표 등급 하나에 대한 계산 결과 */
export interface CalcResult {
  /** 등급 기준 캐시 */
  targetCash: number;
  /** PC방 이용으로 환산되는 캐시 (13주분) */
  pcCash: number;
  /** 현금으로 사야 하는 캐시 */
  needCash: number;

  fills: TierFill[];
  /** 조건 한도를 모두 쓰고도 남은 금액 (할인 없이 계산됨) */
  overflow: number;
  /** 총 결제액 */
  paid: number;
  /** 총 적립액 */
  earned: number;
  /** 결제액 − 적립액 */
  spend: number;
  /** 캐시 1원어치를 확보하는 데 드는 실제 비용 */
  costPerCash: number;

  cash: ItemYield;
  /** 적립되는 크레딧 총량 */
  creditEarned: number;
  credit: ItemYield;

  /** 캐시 + 크레딧 아이템 판매 메소 합계 */
  meso: number;
  mesoAfterFee: number;
  /** 메소를 환전해 회수하는 현금 */
  cashBack: number;
  /** 순지출 − 회수 현금 */
  cost: number;
  /** 회수 현금 ÷ 순지출 */
  recovery: number;
  /** 캐시아이템이 이 시세(억)면 실제 비용이 0이 된다 */
  breakEvenSale: number | null;
}
