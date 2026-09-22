import type { ReactNode } from 'react';

interface Props {
  step: number | string;
  title: string;
  desc?: string;
  /** 카드 헤더 우측에 놓을 요소 (예: 초기화 버튼) */
  headerRight?: ReactNode;
  children: ReactNode;
}

/** 번호가 붙은 단계 카드 */
export function Card({ step, title, desc, headerRight, children }: Props) {
  return (
    <section className="card">
      <div className="card-head">
        <div className="step-no" aria-hidden="true">
          {step}
        </div>
        <h2>{title}</h2>
        {headerRight && <div className="card-head-right">{headerRight}</div>}
      </div>
      {desc && <p className="card-desc">{desc}</p>}
      {children}
    </section>
  );
}
