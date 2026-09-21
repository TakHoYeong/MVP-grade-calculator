import { useEffect, useId, useState } from 'react';

interface Props {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
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

/** 표가 아닌 자리에 쓰는 한 줄 입력 (라벨 + 설명 + 입력칸) */
export function InlineField({ label, hint, value, onChange, placeholder }: Props) {
  const id = useId();
  const [text, setText] = useState(() => (value === null ? '' : String(value)));

  useEffect(() => {
    if (toNumber(text) !== value) setText(value === null ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="inline-field">
      <label className="lbl" htmlFor={id}>
        {label}
        {hint && <span className="hint">{hint}</span>}
      </label>
      <input
        id={id}
        className="num"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          const next = sanitize(e.target.value);
          setText(next);
          onChange(toNumber(next));
        }}
      />
    </div>
  );
}
