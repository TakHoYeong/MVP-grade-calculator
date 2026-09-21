import type { Grade, GradeKey } from './types';

/**
 * MVP 등급 사양 (2026년 9월 기준).
 * 출처: 메이플스토리 공식 게임정보 — MVP 시스템
 * https://maplestory.nexon.com/guide/n23gameinformation/articles/425
 *
 * 게임 사양이 바뀌면 이 배열만 고치면 된다.
 * fee 는 메이플 옥션 판매 수수료(%) — 실버 이상 3%, 그 아래는 기본 5%.
 */
export const GRADES: readonly Grade[] = [
  { key: 'bronze', name: '브론즈', req: 150_000, fee: 5 },
  { key: 'silver', name: '실버', req: 300_000, fee: 3 },
  { key: 'gold', name: '골드', req: 600_000, fee: 3 },
  { key: 'diamond', name: '다이아', req: 900_000, fee: 3 },
  { key: 'red', name: '레드', req: 1_500_000, fee: 3 },
  { key: 'black', name: '블랙', req: 2_500_000, fee: 3 },
] as const;

/** 프리미엄PC방: 6분당 100캐시 = 시간당 1,000캐시 */
export const PC_CASH_PER_HOUR = 1_000;

/** MVP 집계 기간(주) */
export const WEEKS = 13;

/** 월 환산에 쓰는 주 수 (365 / 7 / 12) */
export const WEEKS_PER_MONTH = 4.345;

/** 블랙 등급 초과분 이월 한도 */
export const BLACK_CARRYOVER_CAP = 10_000_000;

export function findGrade(key: GradeKey): Grade {
  return GRADES.find((g) => g.key === key) ?? GRADES[GRADES.length - 1];
}
