import { GRADES } from '../lib/grades';
import { manwon } from '../lib/format';
import type { GradeKey } from '../lib/types';

interface Props {
  value: GradeKey;
  onChange: (key: GradeKey) => void;
}

export function GradePicker({ value, onChange }: Props) {
  return (
    <div className="grade-grid" role="group" aria-label="목표 MVP 등급">
      {GRADES.map((g) => (
        <button
          key={g.key}
          type="button"
          className="grade-chip"
          aria-pressed={g.key === value}
          onClick={() => onChange(g.key)}
        >
          <span className="gn">{g.name}</span>
          <span className="gq">{manwon(g.req)} 캐시</span>
        </button>
      ))}
    </div>
  );
}
