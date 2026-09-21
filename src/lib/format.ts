const LOCALE = 'ko-KR';

/** 정수 + 천 단위 구분 */
export function int(v: number): string {
  if (!Number.isFinite(v)) return '0';
  return Math.round(v).toLocaleString(LOCALE);
}

/** 원화 */
export function won(v: number): string {
  return `${int(v)}원`;
}

/** 억 메소 (소수 둘째 자리) */
export function eok(v: number): string {
  if (!Number.isFinite(v)) v = 0;
  return v.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 비율 (0.85 → 85.0%) */
export function pct(v: number): string {
  if (!Number.isFinite(v)) v = 0;
  return `${(v * 100).toLocaleString(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

/** 개수 (정수 — 아이템은 정수 개수만 산다) */
export function count(v: number): string {
  if (!Number.isFinite(v)) v = 0;
  return `${Math.round(v).toLocaleString(LOCALE)}개`;
}

/** 250000 → "25만" */
export function manwon(v: number): string {
  return `${(v / 10_000).toLocaleString(LOCALE)}만`;
}

/** 소수 자리 고정 */
export function fixed(v: number, digits: number): string {
  if (!Number.isFinite(v)) v = 0;
  return v.toFixed(digits);
}
