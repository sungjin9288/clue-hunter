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
  onUseHint: () => void;
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
  onUseHint,
  onSubmit,
  gradeResult
}: Props) {
  const solved = TimelineEngine.isSolved(caseData, saveData.timelinePlacement);
  const questionMap = new Map(caseData.report.questions.map((q) => [q.qId, q]));

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
                evidenceClueIds: saveData.reportEvidenceClueIds,
                hintUses: saveData.hintUses
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
                <p className="rank-display">
                  종합 랭크: <strong>{gradeResult.rank}</strong>
                </p>
                {gradeResult.rankReason ? (
                  <p className="muted">{gradeResult.rankReason}</p>
                ) : null}
                <p>
                  점수: {gradeResult.scorePercent}% ({gradeResult.passed}/{gradeResult.total})
                </p>
                <p className="muted">
                  챌린지 상태: {gradeResult.challengeStatus.noHint ? "No-Hint✓" : "No-Hint✗"} ·{" "}
                  {gradeResult.challengeStatus.tightEvidence ? "Tight-Evidence✓" : "Tight-Evidence✗"}
                </p>
                {gradeResult.details.map((d) => (
                  <div key={d.qId}>
                    <p>
                      {d.qId}: {d.pass ? "통과" : "실패"} (정답 {String(d.optionCorrect)}, 근거 {String(d.evidenceSatisfied)})
                    </p>
                    {(() => {
                      const question = questionMap.get(d.qId);
                      const feedback = question?.options.find((o) => o.id === d.selectedOptionId)?.feedbackMd;
                      return feedback ? <p className="muted">{feedback}</p> : null;
                    })()}
                  </div>
                ))}

                {gradeResult.rank === "S" && caseData.explanations.secretEndingMd && (
                  <div className="secret-ending-box">
                    <h4>[S랭크 보상] 시크릿 엔딩</h4>
                    <p>{caseData.explanations.secretEndingMd}</p>
                  </div>
                )}
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
