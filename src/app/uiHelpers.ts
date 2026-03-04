export interface NextActionGuideParams {
  cluesCount: number;
  interrogationSuccessCount: number;
  timelineFilledCount: number;
  timelineTotal: number;
  reportEvidenceCount: number;
  reportEvidenceMin: number;
  reportSubmitted: boolean;
}

export function getNextActionGuide(params: NextActionGuideParams): string {
  if (params.cluesCount < 3) {
    return "다음 행동: 현장/문서 탭에서 시간 관련 단서를 3개 이상 모아 흐름을 잡으세요.";
  }
  if (params.interrogationSuccessCount < 1) {
    return "다음 행동: 심문 탭에서 확보한 단서를 제시해 진술 모순을 한 번 이상 끌어내세요.";
  }
  if (params.timelineFilledCount < params.timelineTotal) {
    return "다음 행동: 보드 탭에서 빈 타임라인 슬롯을 먼저 모두 채워보세요.";
  }
  if (params.reportEvidenceCount < params.reportEvidenceMin) {
    return `다음 행동: 보고서 근거 단서를 최소 ${params.reportEvidenceMin}장 첨부하세요.`;
  }
  if (!params.reportSubmitted) {
    return "다음 행동: 보고서를 제출해 현재 추론의 판정을 확인하세요.";
  }
  return "다음 행동: 사건을 재검토해 더 높은 정확도로 재도전할 수 있습니다.";
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function buildExportPayload(
  buildVersion: string,
  caseId: string,
  saveData: unknown,
  exportedAt: Date = new Date()
): string {
  return JSON.stringify(
    { buildVersion, exportedAt: exportedAt.toISOString(), caseId, saveData },
    null,
    2
  );
}
