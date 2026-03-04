import type { CaseSchemaV01 } from "../engine/caseTypes";
import type { CaseSaveV01 } from "../engine/SaveService";
import { TimelineBoard } from "../components/TimelineBoard";
import { ClueConnectionBoard } from "../components/ClueConnectionBoard";
import { CaseResultScreen } from "./CaseResultScreen";
import { TimelineEngine } from "../engine/TimelineEngine";
import { ReportEngine, type GradeResult } from "../engine/ReportEngine";

interface Props {
  caseData: CaseSchemaV01;
  saveData: CaseSaveV01;
  onPlace: (slotId: string, clueId: string) => void;
  onClear: (slotId: string) => void;
  onDiscover: (connectionId: string, revealClueIds?: string[]) => void;
  onSetReportAnswer: (qId: string, optionId: string) => void;
  onToggleEvidence: (clueId: string) => void;
  onUseHint: () => void;
  onSubmit: (result: GradeResult) => void;
  onBackToMenu: () => void;
  onReset: () => void;
  gradeResult: GradeResult | null;
}

export function BoardReportScreen({
  caseData,
  saveData,
  onPlace,
  onClear,
  onDiscover,
  onSetReportAnswer,
  onToggleEvidence,
  onUseHint,
  onSubmit,
  onBackToMenu,
  onReset,
  gradeResult
}: Props) {
  if (saveData.reportSubmitted && gradeResult) {
    return (
      <CaseResultScreen
        caseData={caseData}
        gradeResult={gradeResult}
        onBackToMenu={onBackToMenu}
        onReset={onReset}
      />
    );
  }

  const solved = TimelineEngine.isSolved(caseData, saveData.timelinePlacement);

  return (
    <section>
      <TimelineBoard
        caseData={caseData}
        obtainedClueIds={saveData.obtainedClueIds}
        placement={saveData.timelinePlacement}
        onPlace={onPlace}
        onClear={onClear}
      />

      <ClueConnectionBoard
        caseData={caseData}
        saveData={saveData}
        onDiscover={onDiscover}
      />

      <section className="panel">
        <h3>타임라인 판정</h3>
        <p>{solved ? "정답과 일치합니다." : "아직 정답과 다릅니다."}</p>
      </section>

      <section className="panel">
        <h3>보고서 제출</h3>
        <p className="muted">근거 단서 최소 {caseData.report.minEvidenceToSubmit}장 첨부 필요</p>
        <p className="muted">
          S 루트: 전 문항 통과 + 힌트 0회 + 근거 {caseData.report.minEvidenceToSubmit}장 정확히
        </p>
        <p className="muted">
          힌트 사용: {saveData.hintUses}/{caseData.hintPolicy.maxUses}
        </p>
        <button
          type="button"
          disabled={saveData.hintUses >= caseData.hintPolicy.maxUses}
          onClick={onUseHint}
        >
          힌트 사용 (+1)
        </button>

        {caseData.report.questions.map((q) => (
          <div key={q.qId} className="question-block">
            <strong>{q.prompt}</strong>
            <div className="options-row">
              {q.options.map((o) => (
                <label key={o.id}>
                  <input
                    type="radio"
                    name={q.qId}
                    value={o.id}
                    data-testid={`report-answer-${q.qId}-${o.id}`}
                    checked={saveData.reportAnswers[q.qId] === o.id}
                    onChange={() => onSetReportAnswer(q.qId, o.id)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
            <p className="muted" style={{ marginTop: "6px" }}>
              힌트:{" "}
              {saveData.hintUses <= 0
                ? "아직 없음"
                : [
                  saveData.hintUses >= 1 ? q.hint.l1 : null,
                  saveData.hintUses >= 2 ? q.hint.l2 : null,
                  saveData.hintUses >= 3 ? q.hint.l3 : null
                ]
                  .filter(Boolean)
                  .join(" / ")}
            </p>
          </div>
        ))}

        <details data-testid="report-evidence-panel">
          <summary>근거 단서 첨부</summary>
          <div className="evidence-grid">
            {saveData.obtainedClueIds.map((clueId) => {
              const clue = caseData.clues.find((c) => c.clueId === clueId);
              if (!clue) return null;
              return (
                <label key={clueId}>
                  <input
                    type="checkbox"
                    data-testid={`report-evidence-${clueId}`}
                    checked={saveData.reportEvidenceClueIds.includes(clueId)}
                    onChange={() => onToggleEvidence(clueId)}
                  />
                  {clue.title}
                </label>
              );
            })}
          </div>
        </details>

        <button
          type="button"
          data-testid="report-submit-button"
          onClick={() =>
            onSubmit(
              ReportEngine.grade({
                caseData,
                answers: saveData.reportAnswers,
                evidenceClueIds: saveData.reportEvidenceClueIds,
                hintUses: saveData.hintUses
              })
            )
          }
        >
          보고서 제출/채점
        </button>

        {gradeResult && !gradeResult.canSubmit && (
          <div className="grade-box">
            <p>{gradeResult.reason}</p>
          </div>
        )}
      </section>
    </section>
  );
}
