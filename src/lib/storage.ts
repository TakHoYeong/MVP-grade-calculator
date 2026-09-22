import type { CalcState } from './types';

/**
 * 입력값을 브라우저에만 저장한다.
 * 저장 구조를 바꾸면 KEY 의 버전을 올려 옛 데이터와 충돌을 피한다.
 */
const KEY = 'mvp-calc-state-v2';

export function loadState(): CalcState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CalcState;
    // 최소한의 형태 검증. 구조가 바뀐 옛 데이터는 버린다.
    if (
      !parsed ||
      !Array.isArray(parsed.tiers) ||
      !Array.isArray(parsed.cashItems) ||
      !Array.isArray(parsed.sales)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state: CalcState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 시크릿 모드나 저장 용량 초과 — 저장만 실패하고 계산은 계속된다
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
