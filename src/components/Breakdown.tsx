import { eok, fixed, int, won } from '../lib/format';
import type { CalcResult, Grade } from '../lib/types';

interface Props {
  grade: Grade;
  result: CalcResult;
  alreadyCash: number;
  feeRate: number;
}

function Group({ label }: { label: string }) {
  return <div className="bd-group">{label}</div>;
}

function Row({ k, v, total }: { k: string; v: string; total?: boolean }) {
  return (
    <div className={`bd-row${total ? ' is-total' : ''}`}>
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

/** 계산 과정을 단계별로 펼쳐 보여준다 */
export function Breakdown({ grade, result, alreadyCash, feeRate }: Props) {
  return (
    <div>
      <Group label="목표 채우기" />
      <Row k="목표 등급 기준" v={`${int(grade.req)}캐시`} />
      <Row k="누적된 캐시" v={`${int(alreadyCash)}캐시`} />
      <Row k="PC방 환산 캐시 (13주)" v={`${int(result.pcCash)}캐시`} />
      <Row k="현금으로 살 캐시" v={`${int(result.needCash)}캐시`} />

      <Group label="캐시 결제" />
      <Row k="결제액" v={won(result.paid)} />
      <Row k="적립액" v={won(result.earned)} />
      <Row k="순지출" v={won(result.spend)} />
      <Row k="캐시당 실질 원가" v={`${fixed(result.costPerCash, 4)}원`} />

      <Group label="판매 시뮬레이션" />
      <Row k="캐시 사용 / 목표" v={`${int(result.sale.cashUsed)} / ${int(result.needCash)}`} />
      <Row k="크레딧 사용 / 가용" v={`${int(result.sale.creditUsed)} / ${int(result.creditAvailable)}`} />
      <Row k="입력한 총 판매메소" v={`${eok(result.sale.mesoRaw)}억`} />
      <Row k="이 등급 환산 판매메소" v={`${eok(result.meso)}억`} />
      <Row k={`경매장 수수료 ${feeRate}% 차감 후`} v={`${eok(result.mesoAfterFee)}억`} />
      <Row k="환전 회수 현금" v={won(result.cashBack)} />

      <Group label="합계" />
      <Row k={`${grade.name}까지 추가로 드는 현금`} v={won(result.cost)} total />
    </div>
  );
}
