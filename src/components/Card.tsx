import type { ReactNode } from 'react';

interface Props {
  step: number | string;
  title: string;
  desc?: string;
  /** 카드 헤더 우측에 놓을 요소 (예: 초기화 버튼) */
  headerRight?: ReactNode;
  children: ReactNode;
}

/**
 * 섹션 카드.
 * step 이 숫자면 사각형 안의 번호(워크플로 단계), 문자면 분류 라벨 칩으로 표시한다.
 */
export function Card({ step, title, desc, headerRight, children }: Props) {
  return (
    <section className="card">
      <div className="card-head">
        {typeof step === 'number' ? (
          <span className="step-no" aria-hidden="true">
            {step}
          </span>
        ) : (
          <span className="step-tag">{step}</span>
        )}
        <h2>{title}</h2>
        {headerRight && <div className="card-head-right">{headerRight}</div>}
      </div>
      {desc && <p className="card-desc">{desc}</p>}
      {children}
    </section>
  );
}
