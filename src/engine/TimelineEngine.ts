import type { CaseSchemaV01 } from "./caseTypes";

export const TimelineEngine = {
  getAllowedClues(caseData: CaseSchemaV01, slotId: string): string[] {
    return caseData.timeline.slots.find((s) => s.slotId === slotId)?.allowedClueIds ?? [];
  },

  canPlace(caseData: CaseSchemaV01, slotId: string, clueId: string): boolean {
    return this.getAllowedClues(caseData, slotId).includes(clueId);
  },

  place(
    placement: Record<string, string | null>,
    slotId: string,
    clueId: string
  ): Record<string, string | null> {
    return { ...placement, [slotId]: clueId };
  },

  clear(placement: Record<string, string | null>, slotId: string): Record<string, string | null> {
    return { ...placement, [slotId]: null };
  },

  isSolved(caseData: CaseSchemaV01, placement: Record<string, string | null>): boolean {
    return caseData.timeline.solution.every((row) => placement[row.slotId] === row.clueId);
  }
};
