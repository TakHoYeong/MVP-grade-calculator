import type { CalcState } from './types';

/** 행 추가·초기화에 쓰는 id 생성기 */
let seq = 0;
export function newId(prefix = 'r'): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

/**
 * 처음 열었을 때의 값.
 * 예시 데이터(충전 조건·판매 계획)는 넣지 않고 빈 화면으로 시작한다.
 * 사용자가 남의 입력값을 지우고 시작하지 않도록 하기 위함이다.
 * 경매장 수수료만 기본 5%(수령 방식에 따라 3%로 낮춤)로 둔다 — 비워 두면 수수료가
 * 0으로 계산돼 비용이 실제보다 낮게 나오기 때문이다.
 */
export function createDefaultState(): CalcState {
  return {
    grade: 'bronze',
    alreadyCash: null,
    pcHours: null,
    tiers: [],
    sales: [],
    feeRate: 5,
    feeRateManual: false,
    exRate: null,
  };
}
