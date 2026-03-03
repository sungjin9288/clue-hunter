import type { CaseSchemaV01 } from "./caseTypes";

export interface PreflightResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const pushUniqueError = (bucket: Set<string>, id: string, label: string, errors: string[]) => {
  if (bucket.has(id)) {
    errors.push(`[Duplicate ${label}] ${id}`);
    return;
  }
  bucket.add(id);
};

export function validateCasePreflight(c: CaseSchemaV01): PreflightResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const scenes = c.scenes ?? [];
  const documents = c.documents ?? [];
  const clues = c.clues ?? [];
  const interrogations = c.interrogations ?? [];
  const timelineSlots = c.timeline?.slots ?? [];
  const timelineSolution = c.timeline?.solution ?? [];
  const reportQuestions = c.report?.questions ?? [];

  const sceneIds = new Set<string>();
  const hotspotIds = new Set<string>();
  const docIds = new Set<string>();
  const clueIds = new Set<string>();
  const nodeIds = new Set<string>();
  const slotIds = new Set<string>();
  const characterIds = new Set<string>();

  pushUniqueError(characterIds, c.characters.victim.id, "characterId", errors);
  for (const suspect of c.characters.suspects ?? []) {
    pushUniqueError(characterIds, suspect.id, "characterId", errors);
  }
  for (const witness of c.characters.witnesses ?? []) {
    pushUniqueError(characterIds, witness.id, "characterId", errors);
  }

  for (const scene of scenes) {
    pushUniqueError(sceneIds, scene.sceneId, "sceneId", errors);
    for (const hotspot of scene.hotspots ?? []) {
      pushUniqueError(hotspotIds, hotspot.hotspotId, "hotspotId", errors);
    }
  }

  for (const doc of documents) {
    pushUniqueError(docIds, doc.docId, "docId", errors);
  }

  for (const clue of clues) {
    pushUniqueError(clueIds, clue.clueId, "clueId", errors);
  }

  for (const interrogation of interrogations) {
    if (!characterIds.has(interrogation.characterId)) {
      errors.push(
        `[Missing Ref] interrogations(${interrogation.characterId}).characterId is not a known character`
      );
    }

    const localNodeIds = new Set<string>();

    for (const node of interrogation.nodes ?? []) {
      pushUniqueError(nodeIds, node.nodeId, "nodeId", errors);
      localNodeIds.add(node.nodeId);
    }

    if (!localNodeIds.has(interrogation.startNodeId)) {
      errors.push(
        `[Missing Ref] interrogations(${interrogation.characterId}).startNodeId=${interrogation.startNodeId}`
      );
    }

    for (const node of interrogation.nodes ?? []) {
      if (!characterIds.has(node.speakerId)) {
        errors.push(
          `[Missing Ref] node(${node.nodeId}).speakerId=${node.speakerId} is not a known character`
        );
      }

      for (const choice of node.choices ?? []) {
        if (choice.nextNodeId && !localNodeIds.has(choice.nextNodeId)) {
          errors.push(
            `[Missing Ref] node(${node.nodeId}).choice(${choice.choiceId}).nextNodeId=${choice.nextNodeId}`
          );
        }

        if (!choice.evidenceCheck) continue;

        if (!localNodeIds.has(choice.evidenceCheck.successNodeId)) {
          errors.push(
            `[Missing Ref] node(${node.nodeId}).choice(${choice.choiceId}).successNodeId=${choice.evidenceCheck.successNodeId}`
          );
        }

        if (!localNodeIds.has(choice.evidenceCheck.failNodeId)) {
          errors.push(
            `[Missing Ref] node(${node.nodeId}).choice(${choice.choiceId}).failNodeId=${choice.evidenceCheck.failNodeId}`
          );
        }

        for (const accepted of choice.evidenceCheck.acceptedClueIds ?? []) {
          if (!clueIds.has(accepted)) {
            errors.push(
              `[Missing Ref] evidenceCheck.acceptedClueIds contains unknown clueId=${accepted}`
            );
          }
        }

        for (const grant of choice.evidenceCheck.grantClueIds ?? []) {
          if (!clueIds.has(grant)) {
            errors.push(`[Missing Ref] evidenceCheck.grantClueIds contains unknown clueId=${grant}`);
          }
        }
      }
    }
  }

  for (const scene of scenes) {
    for (const hotspot of scene.hotspots ?? []) {
      for (const clueId of hotspot.rewardClueIds ?? []) {
        if (!clueIds.has(clueId)) {
          errors.push(`[Missing Ref] hotspot(${hotspot.hotspotId}).rewardClueIds=${clueId}`);
        }
      }
    }
  }

  for (const doc of documents) {
    for (const clueId of doc.rewardClueIds ?? []) {
      if (!clueIds.has(clueId)) {
        errors.push(`[Missing Ref] document(${doc.docId}).rewardClueIds=${clueId}`);
      }
    }
  }

  for (const clue of clues) {
    if (clue.source.type === "scene" && !hotspotIds.has(clue.source.id)) {
      errors.push(`[Missing Ref] clue(${clue.clueId}).source(scene)=${clue.source.id}`);
    }

    if (clue.source.type === "doc" && !docIds.has(clue.source.id)) {
      errors.push(`[Missing Ref] clue(${clue.clueId}).source(doc)=${clue.source.id}`);
    }

    if (clue.source.type === "interrogation" && !nodeIds.has(clue.source.id)) {
      errors.push(`[Missing Ref] clue(${clue.clueId}).source(interrogation)=${clue.source.id}`);
    }
  }

  if (timelineSlots.length !== 5) {
    errors.push(`[Rule] timeline.slots must be 5 for MVP, got ${timelineSlots.length}`);
  }

  for (const slot of timelineSlots) {
    pushUniqueError(slotIds, slot.slotId, "timeline.slotId", errors);

    for (const allowed of slot.allowedClueIds ?? []) {
      if (!clueIds.has(allowed)) {
        errors.push(`[Missing Ref] timeline.slot(${slot.slotId}).allowedClueIds=${allowed}`);
      }
    }
  }

  if (timelineSolution.length !== timelineSlots.length) {
    errors.push(
      `[Rule] timeline.solution length must match timeline.slots length (${timelineSlots.length}), got ${timelineSolution.length}`
    );
  }

  const solutionSlotIds = new Set<string>();
  for (const row of timelineSolution) {
    pushUniqueError(solutionSlotIds, row.slotId, "timeline.solution.slotId", errors);

    if (!slotIds.has(row.slotId)) {
      errors.push(`[Missing Ref] timeline.solution.slotId=${row.slotId}`);
    }

    if (!clueIds.has(row.clueId)) {
      errors.push(`[Missing Ref] timeline.solution.clueId=${row.clueId}`);
    }

    const slot = timelineSlots.find((s) => s.slotId === row.slotId);
    if (slot && !(slot.allowedClueIds ?? []).includes(row.clueId)) {
      errors.push(`[Rule] timeline.solution(${row.slotId}) clue ${row.clueId} is not allowed`);
    }

    const solutionClue = clues.find((clue) => clue.clueId === row.clueId);
    if (solutionClue && !solutionClue.tags?.time) {
      warnings.push(
        `[Warning] timeline.solution clue(${row.clueId}) has no tags.time (slot ${row.slotId})`
      );
    }
  }

  for (const slot of timelineSlots) {
    if (!solutionSlotIds.has(slot.slotId)) {
      errors.push(`[Missing Ref] timeline.solution does not cover slotId=${slot.slotId}`);
    }
  }

  const questionIds = new Set<string>();
  for (const q of reportQuestions) {
    pushUniqueError(questionIds, q.qId, "report.qId", errors);

    const optionIds = new Set((q.options ?? []).map((o) => o.id));
    if (!optionIds.has(q.correctOptionId)) {
      errors.push(`[Missing Ref] report.question(${q.qId}).correctOptionId=${q.correctOptionId}`);
    }

    if (!characterIds.has(q.correctOptionId)) {
      errors.push(
        `[Missing Ref] report.question(${q.qId}).correctOptionId=${q.correctOptionId} is not a known character`
      );
    }

    for (const option of q.options ?? []) {
      if (!characterIds.has(option.id)) {
        errors.push(
          `[Missing Ref] report.question(${q.qId}).option.id=${option.id} is not a known character`
        );
      }
    }

    for (const set of q.requiredClueSets ?? []) {
      for (const clueId of set) {
        if (!clueIds.has(clueId)) {
          errors.push(`[Missing Ref] report.question(${q.qId}).requiredClueSets contains ${clueId}`);
        }
      }
    }
  }

  if (reportQuestions.length === 0) {
    warnings.push("[Warning] report.questions is empty");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}
