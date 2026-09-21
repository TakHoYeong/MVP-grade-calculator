import type { ReactNode } from 'react';

interface Props {
  step: number | string;
  title: string;
  desc?: string;
  children: ReactNode;
}

/** 번호가 붙은 단계 카드 */
export function Card({ step, title, desc, children }: Props) {
  return (
    <section className="card">
      <div className="card-head">
        <div className="step-no" aria-hidden="true">
          {step}
        </div>
        <h2>{title}</h2>
      </div>
      {desc && <p className="card-desc">{desc}</p>}
      {children}
    </section>
  );
}
