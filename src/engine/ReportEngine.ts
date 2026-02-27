import type { CaseSchemaV01 } from "./caseTypes";

export interface GradeResult {
  canSubmit: boolean;
  reason?: string;
  total: number;
  passed: number;
  scorePercent: number;
  details: {
    qId: string;
    selectedOptionId?: string;
    optionCorrect: boolean;
    evidenceSatisfied: boolean;
    pass: boolean;
  }[];
}

export const ReportEngine = {
  grade(params: {
    caseData: CaseSchemaV01;
    answers: Record<string, string>;
    evidenceClueIds: string[];
  }): GradeResult {
    const { caseData, answers, evidenceClueIds } = params;

    if (evidenceClueIds.length < caseData.report.minEvidenceToSubmit) {
      return {
        canSubmit: false,
        reason: `근거 단서는 최소 ${caseData.report.minEvidenceToSubmit}개 필요합니다.`,
        total: caseData.report.questions.length,
        passed: 0,
        scorePercent: 0,
        details: []
      };
    }

    const details = caseData.report.questions.map((q) => {
      const selectedOptionId = answers[q.qId];
      const optionCorrect = selectedOptionId === q.correctOptionId;

      const evidenceSatisfied =
        q.requiredClueSets.length === 0
          ? true
          : q.requiredClueSets.some((set) => set.every((clueId) => evidenceClueIds.includes(clueId)));

      return {
        qId: q.qId,
        selectedOptionId,
        optionCorrect,
        evidenceSatisfied,
        pass: optionCorrect && evidenceSatisfied
      };
    });

    const passed = details.filter((d) => d.pass).length;
    const total = caseData.report.questions.length;
    const scorePercent = total === 0 ? 0 : Math.round((passed / total) * 100);

    return {
      canSubmit: true,
      total,
      passed,
      scorePercent,
      details
    };
  }
};
