import { useEffect, useId, useState } from 'react';

interface Props {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  /** 데스크톱에서는 헤더 줄이 이름을 대신하므로 라벨을 숨긴다 */
  hideLabelOnWide?: boolean;
}

/** 입력 문자열에서 숫자와 소수점 하나만 남긴다 */
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

/**
 * 숫자 입력 칸.
 *
 * type="number" 대신 text + inputMode="decimal" 을 쓴다.
 * 모바일에서 숫자 키패드가 뜨면서, "1." 처럼 입력 중인 중간 상태가
 * 브라우저에 의해 지워지지 않는다.
 */
export function NumberField({ label, value, onChange, placeholder, hideLabelOnWide = true }: Props) {
  const id = useId();
  const [text, setText] = useState(() => (value === null ? '' : String(value)));

  // 값이 바깥에서 바뀐 경우(초기화, 등급 변경에 따른 수수료 자동 설정 등)에만 다시 맞춘다.
  // 내가 방금 입력해서 바뀐 값이면 parsed 와 value 가 같으므로 건드리지 않는다.
  useEffect(() => {
    if (toNumber(text) !== value) setText(value === null ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div>
      <label className="field-label" htmlFor={id} style={hideLabelOnWide ? undefined : { display: 'block' }}>
        {label}
      </label>
      <input
        id={id}
        className="num"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => {
          const next = sanitize(e.target.value);
          setText(next);
          onChange(toNumber(next));
        }}
      />
    </div>
  );
}
