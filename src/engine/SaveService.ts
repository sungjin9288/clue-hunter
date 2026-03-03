import type { CaseSchemaV01 } from "./caseTypes";

export interface CaseSaveV01 {
  version: "0.1";
  caseId: string;
  obtainedClueIds: string[];
  readDocIds: string[];
  interrogationNodeProgress: Record<string, string>;
  interrogationSuccessCount: number;
  timelinePlacement: Record<string, string | null>;
  reportAnswers: Record<string, string>;
  reportEvidenceClueIds: string[];
  reportSubmitted: boolean;
  hintUses: number;
  updatedAt: number;
}

const storageKey = (caseId: string) => `noir_mvp_${caseId}_v01`;
const campaignKey = "noir_mvp_campaign_v01";
type Rank = "S" | "A" | "B" | "C";

const RANK_SCORE: Record<Rank, number> = {
  S: 4,
  A: 3,
  B: 2,
  C: 1
};

export interface CampaignCaseStats {
  attempts: number;
  completedCount: number;
  bestRank: Rank | null;
  firstClearedAt: number | null;
  perfectClearCount: number;
  challengeFlags: {
    noHintClear: boolean;
    tightEvidenceClear: boolean;
  };
  totalPlaySeconds: number;
  lastPlayedAt: number | null;
}

export interface CampaignProgressV01 {
  version: "0.1";
  totalPlaySeconds: number;
  cases: Record<string, CampaignCaseStats>;
}

export interface CaseClearUpdate {
  campaign: CampaignProgressV01;
  clearBadges: string[];
}

const createDefaultCampaign = (): CampaignProgressV01 => ({
  version: "0.1",
  totalPlaySeconds: 0,
  cases: {}
});

const createDefaultCaseStats = (): CampaignCaseStats => ({
  attempts: 0,
  completedCount: 0,
  bestRank: null,
  firstClearedAt: null,
  perfectClearCount: 0,
  challengeFlags: {
    noHintClear: false,
    tightEvidenceClear: false
  },
  totalPlaySeconds: 0,
  lastPlayedAt: null
});

const normalizeCaseStats = (stats?: Partial<CampaignCaseStats>): CampaignCaseStats => {
  const base = createDefaultCaseStats();
  return {
    ...base,
    ...stats,
    challengeFlags: {
      ...base.challengeFlags,
      ...(stats?.challengeFlags ?? {})
    }
  };
};

const ensureCaseStats = (
  cases: Record<string, CampaignCaseStats>,
  caseId: string
): CampaignCaseStats => {
  if (!cases[caseId]) {
    cases[caseId] = createDefaultCaseStats();
  } else {
    cases[caseId] = normalizeCaseStats(cases[caseId]);
  }
  return cases[caseId];
};

export function createInitialSave(caseData: CaseSchemaV01): CaseSaveV01 {
  const interrogationNodeProgress: Record<string, string> = {};
  for (const i of caseData.interrogations) {
    interrogationNodeProgress[i.characterId] = i.startNodeId;
  }

  const timelinePlacement: Record<string, string | null> = {};
  for (const slot of caseData.timeline.slots) {
    timelinePlacement[slot.slotId] = null;
  }

  return {
    version: "0.1",
    caseId: caseData.caseId,
    obtainedClueIds: [],
    readDocIds: [],
    interrogationNodeProgress,
    interrogationSuccessCount: 0,
    timelinePlacement,
    reportAnswers: {},
    reportEvidenceClueIds: [],
    reportSubmitted: false,
    hintUses: 0,
    updatedAt: Date.now()
  };
}

export const SaveService = {
  load(caseId: string): CaseSaveV01 | null {
    const raw = localStorage.getItem(storageKey(caseId));
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as Partial<CaseSaveV01>;
      if (parsed.version !== "0.1") return null;
      if (parsed.caseId !== caseId) return null;
      return {
        version: "0.1",
        caseId,
        obtainedClueIds: parsed.obtainedClueIds ?? [],
        readDocIds: parsed.readDocIds ?? [],
        interrogationNodeProgress: parsed.interrogationNodeProgress ?? {},
        interrogationSuccessCount: parsed.interrogationSuccessCount ?? 0,
        timelinePlacement: parsed.timelinePlacement ?? {},
        reportAnswers: parsed.reportAnswers ?? {},
        reportEvidenceClueIds: parsed.reportEvidenceClueIds ?? [],
        reportSubmitted: parsed.reportSubmitted ?? false,
        hintUses: parsed.hintUses ?? 0,
        updatedAt: parsed.updatedAt ?? Date.now()
      };
    } catch {
      return null;
    }
  },

  save(data: CaseSaveV01): void {
    const payload: CaseSaveV01 = { ...data, updatedAt: Date.now() };
    localStorage.setItem(storageKey(data.caseId), JSON.stringify(payload));
  },

  clear(caseId: string): void {
    localStorage.removeItem(storageKey(caseId));
  },

  loadCampaign(): CampaignProgressV01 {
    const raw = localStorage.getItem(campaignKey);
    if (!raw) return createDefaultCampaign();

    try {
      const parsed = JSON.parse(raw) as Partial<CampaignProgressV01>;
      if (parsed.version !== "0.1") return createDefaultCampaign();
      const normalizedCases: Record<string, CampaignCaseStats> = {};
      for (const [caseId, stats] of Object.entries(parsed.cases ?? {})) {
        normalizedCases[caseId] = normalizeCaseStats(stats);
      }
      return {
        version: "0.1",
        totalPlaySeconds: parsed.totalPlaySeconds ?? 0,
        cases: normalizedCases
      };
    } catch {
      return createDefaultCampaign();
    }
  },

  saveCampaign(campaign: CampaignProgressV01): void {
    localStorage.setItem(campaignKey, JSON.stringify(campaign));
  },

  markCaseOpened(caseId: string): CampaignProgressV01 {
    const campaign = this.loadCampaign();
    const stats = ensureCaseStats(campaign.cases, caseId);
    stats.attempts += 1;
    stats.lastPlayedAt = Date.now();
    this.saveCampaign(campaign);
    return campaign;
  },

  addCasePlaySeconds(caseId: string, seconds: number): CampaignProgressV01 {
    if (seconds <= 0) return this.loadCampaign();
    const campaign = this.loadCampaign();
    const stats = ensureCaseStats(campaign.cases, caseId);
    stats.totalPlaySeconds += seconds;
    stats.lastPlayedAt = Date.now();
    campaign.totalPlaySeconds += seconds;
    this.saveCampaign(campaign);
    return campaign;
  },

  recordCaseClear(params: {
    caseId: string;
    rank: Rank;
    hintUses: number;
    evidenceCount: number;
    minEvidenceCount: number;
  }): CaseClearUpdate {
    const { caseId, rank, hintUses, evidenceCount, minEvidenceCount } = params;
    const campaign = this.loadCampaign();
    const stats = ensureCaseStats(campaign.cases, caseId);
    const clearBadges: string[] = [];
    const hadFirstClear = Boolean(stats.firstClearedAt);
    const hadNoHint = stats.challengeFlags.noHintClear;
    const hadTight = stats.challengeFlags.tightEvidenceClear;

    stats.completedCount += 1;
    stats.lastPlayedAt = Date.now();
    if (!hadFirstClear) {
      stats.firstClearedAt = Date.now();
      clearBadges.push("CASE CLOSED");
    }

    if (!stats.bestRank || RANK_SCORE[rank] > RANK_SCORE[stats.bestRank]) {
      stats.bestRank = rank;
    }

    if (rank === "S") {
      stats.perfectClearCount += 1;
      clearBadges.push("PERFECT CLEAR");
    }

    if (hintUses === 0) {
      stats.challengeFlags.noHintClear = true;
      if (!hadNoHint) clearBadges.push("NO-HINT CLEAR");
    }

    if (evidenceCount === minEvidenceCount) {
      stats.challengeFlags.tightEvidenceClear = true;
      if (!hadTight) clearBadges.push("TIGHT EVIDENCE CLEAR");
    }

    this.saveCampaign(campaign);
    return {
      campaign,
      clearBadges
    };
  }
};
