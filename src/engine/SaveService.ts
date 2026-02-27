import type { CaseSchemaV01 } from "./caseTypes";

export interface CaseSaveV01 {
  version: "0.1";
  caseId: string;
  obtainedClueIds: string[];
  readDocIds: string[];
  interrogationNodeProgress: Record<string, string>;
  timelinePlacement: Record<string, string | null>;
  reportAnswers: Record<string, string>;
  reportEvidenceClueIds: string[];
  reportSubmitted: boolean;
  hintUses: number;
  updatedAt: number;
}

const storageKey = (caseId: string) => `noir_mvp_${caseId}_v01`;

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
      const parsed = JSON.parse(raw) as CaseSaveV01;
      if (parsed.version !== "0.1") return null;
      if (parsed.caseId !== caseId) return null;
      return parsed;
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
  }
};
