import type { CaseSchemaV01 } from "../engine/caseTypes";
import type { CaseSaveV01 } from "../engine/SaveService";
import { TimelineBoard } from "../components/TimelineBoard";
import { TimelineEngine } from "../engine/TimelineEngine";
import { ReportEngine, type GradeResult } from "../engine/ReportEngine";

interface Props {
  caseData: CaseSchemaV01;
  saveData: CaseSaveV01;
  onPlace: (slotId: string, clueId: string) => void;
  onClear: (slotId: string) => void;
  onSetReportAnswer: (qId: string, optionId: string) => void;
  onToggleEvidence: (clueId: string) => void;
  onSubmit: (result: GradeResult) => void;
  gradeResult: GradeResult | null;
}

export function BoardReportScreen({
  caseData,
  saveData,
  onPlace,
  onClear,
  onSetReportAnswer,
  onToggleEvidence,
  onSubmit,
  gradeResult
}: Props) {
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

      <section className="panel">
        <h3>타임라인 판정</h3>
        <p>{solved ? "정답과 일치합니다." : "아직 정답과 다릅니다."}</p>
      </section>

      <section className="panel">
        <h3>보고서 제출</h3>
        <p className="muted">근거 단서 최소 {caseData.report.minEvidenceToSubmit}장 첨부 필요</p>

        {caseData.report.questions.map((q) => (
          <div key={q.qId} className="question-block">
            <strong>{q.prompt}</strong>
            <div className="options-row">
              {q.options.map((o) => (
                <label key={o.id}>
                  <input
                    type="radio"
                    name={q.qId}
                    checked={saveData.reportAnswers[q.qId] === o.id}
                    onChange={() => onSetReportAnswer(q.qId, o.id)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        ))}

        <details>
          <summary>근거 단서 첨부</summary>
          <div className="evidence-grid">
            {saveData.obtainedClueIds.map((clueId) => {
              const clue = caseData.clues.find((c) => c.clueId === clueId);
              if (!clue) return null;
              return (
                <label key={clueId}>
                  <input
                    type="checkbox"
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
          onClick={() =>
            onSubmit(
              ReportEngine.grade({
                caseData,
                answers: saveData.reportAnswers,
                evidenceClueIds: saveData.reportEvidenceClueIds
              })
            )
          }
        >
          보고서 제출/채점
        </button>

        {gradeResult ? (
          <div className="grade-box">
            {gradeResult.canSubmit ? (
              <>
                <p>
                  점수: {gradeResult.scorePercent}% ({gradeResult.passed}/{gradeResult.total})
                </p>
                {gradeResult.details.map((d) => (
                  <p key={d.qId}>
                    {d.qId}: {d.pass ? "통과" : "실패"} (정답 {String(d.optionCorrect)}, 근거 {String(d.evidenceSatisfied)})
                  </p>
                ))}
              </>
            ) : (
              <p>{gradeResult.reason}</p>
            )}
          </div>
        ) : null}
      </section>
    </section>
  );
}
