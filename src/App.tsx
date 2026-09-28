import { useMemo, useState } from 'react';
import { Breakdown } from './components/Breakdown';
import { Card } from './components/Card';
import { GradeCompareTable } from './components/GradeCompareTable';
import { GradePicker } from './components/GradePicker';
import { InlineField } from './components/InlineField';
import { Modal } from './components/Modal';
import { ResultBar } from './components/ResultBar';
import { SaleSim } from './components/SaleSim';
import { TargetComposition } from './components/TargetComposition';
import { TierTable } from './components/TierTable';
import { useCalcState } from './hooks/useCalcState';
import { calculate, n } from './lib/calc';
import { int, won } from './lib/format';
import { findGrade } from './lib/grades';

export default function App() {
  const {
    state,
    patch,
    setGrade,
    patchTier,
    addTier,
    removeTier,
    patchSale,
    addSale,
    removeSale,
    autoFillSales,
    reset,
  } = useCalcState();

  const grade = findGrade(state.grade);
  const fee = n(state.feeRate);
  const alreadyCash = Math.max(0, n(state.alreadyCash));

  // 입력이 바뀔 때만 다시 계산한다
  const result = useMemo(
    () => calculate(state, grade.req, fee, alreadyCash),
    [state, grade.req, fee, alreadyCash],
  );
  const maintenance = useMemo(() => calculate(state, grade.req, fee, 0), [state, grade.req, fee]);

  // 결과바 경고 아이콘에 모을, 덜 입력했거나 확인이 필요한 항목들
  const warnings = useMemo(() => {
    const w: string[] = [];
    if (n(state.exRate) <= 0) {
      w.push('환전 시세가 비어 있어요. 입력하면 환전 회수가 계산됩니다.');
    }
    if (state.feeRate === null) {
      w.push('경매장 수수료가 비어 있어요. 기본 5% 또는 실제 값을 입력하세요.');
    }
    const hasPlan = result.sale.cashUsed > 0 || result.sale.creditUsed > 0;
    const creditLeft = result.creditAvailable - result.sale.creditUsed;
    if (hasPlan && result.creditAvailable > 0 && creditLeft > 0) {
      w.push(
        `가용 크레딧 ${int(result.creditAvailable)} 중 ${int(result.sale.creditUsed)}만 썼어요. 크레딧 아이템을 더 팔면 회수가 늘어요.`,
      );
    } else if (creditLeft < 0) {
      w.push(`크레딧을 가용치보다 ${int(-creditLeft)} 더 썼어요.`);
    }
    return w;
  }, [state.exRate, state.feeRate, result]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="wrap">
      <header className="masthead">
        <h1 className="masthead-title">MVP 등급 계산기</h1>
        <p className="masthead-lede">
          MVP 작업 시에 발생하는 지출의 회수금액을 계산할 수 있습니다.
        </p>
      </header>

      {/* 0단계 */}
      <Card
        step="설정"
        title="목표 등급과 현재 상태"
        desc="등급 기준은 이번 주 포함 최근 13주 누적 넥슨캐시입니다."
        headerRight={
          <button type="button" className="danger-btn" onClick={() => setConfirmReset(true)}>
            초기화
          </button>
        }
      >
        <GradePicker value={state.grade} onChange={setGrade} />

        <InlineField
          label="누적된 캐시"
          hint="최근 13주 동안 이미 사용한 넥슨캐시"
          value={state.alreadyCash}
          placeholder="0"
          comma
          onChange={(v) => patch({ alreadyCash: v })}
        />
        <InlineField
          label="프리미엄PC방 주당 이용 시간"
          hint="시간당 1,000캐시가 MVP 금액에 반영 · PC방 요금은 별도"
          value={state.pcHours}
          placeholder="0"
          onChange={(v) => patch({ pcHours: v })}
        />

        <TargetComposition
          grade={grade}
          alreadyCash={alreadyCash}
          pcCash={result.pcCash}
          needCash={result.needCash}
        />

        <InlineField
          label="환전 시세"
          hint="1억 메소당 현금 시세 (원)"
          value={state.exRate}
          placeholder="1,550"
          comma
          onChange={(v) => patch({ exRate: v })}
        />
        <InlineField
          label="경매장 수수료"
          hint="기본 5% · MVP 실버 이상이거나 PC방에서 수령 시 3%"
          value={state.feeRate}
          onChange={(v) => patch({ feeRate: v })}
        />
      </Card>

      <ResultBar
        grade={grade}
        result={result}
        maintenance={maintenance}
        onDetail={() => setDetailOpen(true)}
        warnings={warnings}
      />

      {/* 1단계 */}
      <Card
        step={1}
        title="넥슨캐시 구매 방식"
        desc="문화상품권 할인, 신용카드 적립처럼 넥슨캐시에 적용한 할인·적립 조건을 넣어 실제 결제 비용을 계산합니다."
      >
        <TierTable
          tiers={state.tiers}
          fills={result.fills}
          onPatch={patchTier}
          onRemove={removeTier}
          onAdd={addTier}
        />

        {state.tiers.length > 0 && result.overflow > 0 && (
          <div className="note warn">
            <b>한도 부족</b> · 조건 한도 합계보다 {int(result.overflow)}캐시가 더 필요합니다. 이
            금액은 할인 없이 계산했습니다. 한도를 비운 조건을 하나 두면 나머지 전부를 그 조건으로
            계산합니다.
          </div>
        )}

        <div className="totals">
          <span>
            현금으로 살 캐시<b>{int(result.needCash)}캐시</b>
          </span>
          <span>
            결제액<b>{won(result.paid)}</b>
          </span>
          <span>
            적립 차감 후 순지출<b>{won(result.spend)}</b>
          </span>
        </div>
      </Card>

      {/* 2단계 */}
      <Card
        step={2}
        title="판매 시뮬레이션"
        desc="실제로 팔 계획(무엇을 얼마에 몇 개)을 그대로 넣으면 회수 현금과 실제 비용이 나옵니다. 각 줄의 효율로 어떤 판매가 유리한지도 함께 보여줍니다."
      >
        <SaleSim
          sales={state.sales}
          result={result}
          onPatch={patchSale}
          onRemove={removeSale}
          onAdd={addSale}
          onAutoFill={autoFillSales}
        />
      </Card>

      {/* 3단계 */}
      <Card
        step={3}
        title="등급별 비용 비교"
        desc="지금 입력한 판매 효율을 각 등급의 필요 캐시에 적용한 예상입니다. 어느 등급이 얼마에 달성되는지 한눈에 비교하세요."
      >
        <GradeCompareTable state={state} alreadyCash={alreadyCash} current={state.grade} />
        <div className="note">
          각 등급의 필요 캐시를 지금 판매 효율로 모두 되판다고 가정한 <b>예상값</b>입니다(위쪽 실제
          비용과 다를 수 있습니다). 유지 비용은 그 등급을 계속 유지할 때 드는 13주 평균이며, 입력한
          경매장 수수료를 모든 등급에 똑같이 적용했습니다.
        </div>
      </Card>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="상세 내역">
        <p className="modal-desc">판매 시뮬레이션 기준으로 계산된 세부 값입니다.</p>
        <Breakdown grade={grade} result={result} alreadyCash={alreadyCash} feeRate={fee} />
        <div className="note">
          <b>계산에서 빠진 것</b> · 마일리지로 할인받아 결제한 금액은 MVP 누적에 반영되지 않습니다.
          청약철회가 가능한 아이템은 캐시보관함에서 인벤토리로 옮길 때 반영됩니다. 이미 결제한
          금액은 지나간 비용이므로 앞으로의 계산에서 제외됩니다. 대량 판매 시 시세가 밀릴 수 있으니
          판매가는 평균 체결가로 넣으세요.
        </div>
      </Modal>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="입력값 초기화">
        <p className="modal-desc">입력한 값이 모두 기본값으로 돌아갑니다. 정말 초기화할까요?</p>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={() => setConfirmReset(false)}>
            취소
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              reset();
              setConfirmReset(false);
            }}
          >
            초기화
          </button>
        </div>
      </Modal>

      <footer className="footer">
        모든 시세·조건은 직접 입력한 값 기준이며, 실제 거래 시세와 다를 수 있습니다.
        <br />
        메소 현금 거래는 운영정책상 제재 사유가 될 수 있습니다.
        <br />
        넥슨 및 메이플스토리와 관련 없는 개인 제작물입니다.
      </footer>
    </div>
  );
}
