import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  /** 천 단위 콤마 표시 (금액 입력용) */
  comma?: boolean;
}

function sanitize(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
}

function toNumber(text: string): number | null {
  if (text === '' || text === '.') return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

/** 정수부에만 천 단위 콤마를 넣는다. 입력 중인 소수점·소수부는 그대로 둔다. */
function group(text: string): string {
  if (text === '') return '';
  const [intPart, decPart] = text.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart === undefined ? grouped : `${grouped}.${decPart}`;
}

/** 표가 아닌 자리에 쓰는 한 줄 입력 (라벨 + 설명 + 입력칸) */
export function InlineField({ label, hint, value, onChange, placeholder, comma = false }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);
  const [text, setText] = useState(() => (value === null ? '' : String(value)));

  useEffect(() => {
    if (toNumber(text) !== value) setText(value === null ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // 콤마가 끼어들어 흐트러진 커서를, 앞쪽 숫자 개수를 기준으로 제자리에 돌려놓는다
  useLayoutEffect(() => {
    if (caretRef.current === null || !inputRef.current) return;
    let remaining = caretRef.current;
    caretRef.current = null;
    const display = comma ? group(text) : text;
    let pos = 0;
    while (pos < display.length && remaining > 0) {
      if (/[\d.]/.test(display[pos])) remaining -= 1;
      pos += 1;
    }
    inputRef.current.setSelectionRange(pos, pos);
  });

  const display = comma ? group(text) : text;

  return (
    <div className="inline-field">
      <label className="lbl" htmlFor={id}>
        {label}
        {hint && <span className="hint">{hint}</span>}
      </label>
      <input
        ref={inputRef}
        id={id}
        className="num"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={display}
        placeholder={placeholder}
        onChange={(e) => {
          const el = e.target;
          if (comma) {
            const upto = el.value.slice(0, el.selectionStart ?? el.value.length);
            caretRef.current = upto.replace(/[^\d.]/g, '').length;
          }
          const next = sanitize(el.value);
          setText(next);
          onChange(toNumber(next));
        }}
      />
    </div>
  );
}
