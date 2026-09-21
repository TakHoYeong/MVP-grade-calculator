import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  /** 데스크톱에서는 헤더 줄이 이름을 대신하므로 라벨을 숨긴다 */
  hideLabelOnWide?: boolean;
  /** 천 단위 콤마 표시 (금액 입력용) */
  comma?: boolean;
}

/** 입력 문자열에서 숫자와 소수점 하나만 남긴다 (콤마 등은 버린다) */
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

/**
 * 숫자 입력 칸.
 *
 * type="number" 대신 text + inputMode="decimal" 을 쓴다.
 * 모바일에서 숫자 키패드가 뜨면서, "1." 처럼 입력 중인 중간 상태가
 * 브라우저에 의해 지워지지 않는다.
 *
 * comma=true 면 화면에는 천 단위 콤마를 붙여 보여주되, 바깥으로 넘기는 값과
 * 내부 상태(text)는 콤마 없는 순수 숫자 문자열로 유지한다.
 */
export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  hideLabelOnWide = true,
  comma = false,
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // 콤마 삽입으로 커서가 밀릴 때, 되돌릴 "앞쪽 숫자 개수"를 잠시 담아 둔다
  const caretRef = useRef<number | null>(null);
  const [text, setText] = useState(() => (value === null ? '' : String(value)));

  // 값이 바깥에서 바뀐 경우(초기화, 등급 변경에 따른 수수료 자동 설정 등)에만 다시 맞춘다.
  // 내가 방금 입력해서 바뀐 값이면 parsed 와 value 가 같으므로 건드리지 않는다.
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
    <div>
      <label
        className="field-label"
        htmlFor={id}
        style={hideLabelOnWide ? undefined : { display: 'block' }}
      >
        {label}
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
        aria-label={label}
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
