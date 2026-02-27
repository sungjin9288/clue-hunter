import type { CaseSchemaV01 } from "./caseTypes";

export type ChoiceApplyResult =
  | {
      ok: true;
      nextNodeId: string;
      evidenceSuccess: boolean | null;
      grantClueIds: string[];
    }
  | { ok: false; error: string };

export const InterrogationEngine = {
  getNode(caseData: CaseSchemaV01, characterId: string, nodeId: string) {
    const interrogation = caseData.interrogations.find((q) => q.characterId === characterId);
    if (!interrogation) return null;
    return interrogation.nodes.find((n) => n.nodeId === nodeId) ?? null;
  },

  applyChoice(params: {
    caseData: CaseSchemaV01;
    characterId: string;
    currentNodeId: string;
    choiceId: string;
    presentedClueId?: string;
  }): ChoiceApplyResult {
    const interrogation = params.caseData.interrogations.find(
      (q) => q.characterId === params.characterId
    );
    if (!interrogation) return { ok: false, error: `Unknown characterId ${params.characterId}` };

    const node = interrogation.nodes.find((n) => n.nodeId === params.currentNodeId);
    if (!node) return { ok: false, error: `Unknown nodeId ${params.currentNodeId}` };

    const choice = node.choices.find((c) => c.choiceId === params.choiceId);
    if (!choice) return { ok: false, error: `Unknown choiceId ${params.choiceId}` };

    if (choice.nextNodeId) {
      return {
        ok: true,
        nextNodeId: choice.nextNodeId,
        evidenceSuccess: null,
        grantClueIds: []
      };
    }

    if (!choice.evidenceCheck) {
      return { ok: false, error: `Choice ${params.choiceId} has no transition` };
    }

    if (!params.presentedClueId) {
      return { ok: false, error: `Choice ${params.choiceId} requires presentedClueId` };
    }

    const success = choice.evidenceCheck.acceptedClueIds.includes(params.presentedClueId);

    return {
      ok: true,
      nextNodeId: success ? choice.evidenceCheck.successNodeId : choice.evidenceCheck.failNodeId,
      evidenceSuccess: success,
      grantClueIds: success ? (choice.evidenceCheck.grantClueIds ?? []) : []
    };
  }
};
