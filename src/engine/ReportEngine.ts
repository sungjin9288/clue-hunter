import type { CaseSchemaV01 } from "./caseTypes";

export interface GradeResult {
  canSubmit: boolean;
  reason?: string;
  total: number;
  passed: number;
  scorePercent: number;
  rank: "S" | "A" | "B" | "C";
  rankReason?: string;
  challengeStatus: {
    noHint: boolean;
    tightEvidence: boolean;
    perfectRoute: boolean;
  };
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
    hintUses: number;
  }): GradeResult {
    const { caseData, answers, evidenceClueIds, hintUses } = params;
    const minEvidence = caseData.report.minEvidenceToSubmit;
    const noHint = hintUses === 0;
    const tightEvidence = evidenceClueIds.length === minEvidence;

    if (evidenceClueIds.length < minEvidence) {
      return {
        canSubmit: false,
        reason: `근거 단서는 최소 ${minEvidence}개 필요합니다.`,
        total: caseData.report.questions.length,
        passed: 0,
        scorePercent: 0,
        rank: "C",
        challengeStatus: {
          noHint,
          tightEvidence,
          perfectRoute: false
        },
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

    let rank: "S" | "A" | "B" | "C" = "C";
    let rankReason: string | undefined;
    const perfectRoute = noHint && tightEvidence;

    if (scorePercent === 100) {
      if (perfectRoute) {
        rank = "S";
      } else if (noHint || tightEvidence) {
        rank = "A";
        rankReason = `S 조건 미달: 힌트 0회 + 최소 근거 ${minEvidence}장 정확히 필요`;
      } else {
        rank = "B";
        rankReason = `S/A 조건 미달: 힌트 사용 또는 근거 과다 제출`;
      }
    } else if (scorePercent >= 66) {
      rank = hintUses >= 2 ? "B" : "A";
      if (hintUses >= 2) {
        rankReason = "힌트 사용량이 높아 랭크가 1단계 하향되었습니다.";
      }
    } else if (scorePercent >= 33) {
      rank = "B";
    }

    return {
      canSubmit: true,
      total,
      passed,
      scorePercent,
      rank,
      rankReason,
      challengeStatus: {
        noHint,
        tightEvidence,
        perfectRoute
      },
      details
    };
  }
};
