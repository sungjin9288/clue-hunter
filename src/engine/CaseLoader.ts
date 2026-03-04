import type { CaseSchemaV01 } from "./caseTypes";
import { validateCasePreflight } from "./validateCasePreflight";

export type CaseLoadResult =
  | { ok: true; data: CaseSchemaV01; warnings: string[] }
  | { ok: false; errors: string[] };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

const isHint = (v: unknown): v is { l1: string; l2: string; l3: string } =>
  isRecord(v) && isString(v.l1) && isString(v.l2) && isString(v.l3);

const isLockedBioArray = (v: unknown): v is { text: string; unlockClueId: string }[] =>
  Array.isArray(v) &&
  v.every((row) => isRecord(row) && isString(row.text) && isString(row.unlockClueId));

export function isCaseSchemaV01(v: unknown): v is CaseSchemaV01 {
  if (!isRecord(v)) return false;
  if (v.schemaVersion !== "0.1") return false;
  if (!isString(v.caseId) || !isString(v.title) || !isString(v.synopsis)) return false;

  const meta = v.meta;
  if (!isRecord(meta)) return false;
  if (meta.tone !== "hardboiled") return false;
  if (!isNumber(meta.estimatedMinutes) || !isNumber(meta.difficulty)) return false;
  if (meta.narratorVoice !== undefined && !isString(meta.narratorVoice)) return false;

  const characters = v.characters;
  if (!isRecord(characters)) return false;
  const victim = characters.victim;
  if (!isRecord(victim)) return false;
  if (victim.id !== "victim" || !isString(victim.name) || !isString(victim.bio)) return false;
  if (victim.lockedBio !== undefined && !isLockedBioArray(victim.lockedBio)) return false;

  if (!Array.isArray(characters.suspects) || !Array.isArray(characters.witnesses)) return false;
  for (const suspect of characters.suspects) {
    if (!isRecord(suspect)) return false;
    if (
      !isString(suspect.id) ||
      !isString(suspect.name) ||
      !isString(suspect.bio) ||
      !isString(suspect.alibiClaim)
    ) {
      return false;
    }
    if (suspect.lockedBio !== undefined && !isLockedBioArray(suspect.lockedBio)) return false;
  }
  for (const witness of characters.witnesses) {
    if (!isRecord(witness)) return false;
    if (!isString(witness.id) || !isString(witness.name) || !isString(witness.bio)) return false;
    if (witness.lockedBio !== undefined && !isLockedBioArray(witness.lockedBio)) return false;
  }

  if (!Array.isArray(v.scenes)) return false;
  for (const scene of v.scenes) {
    if (!isRecord(scene)) return false;
    if (!isString(scene.sceneId) || !isString(scene.title) || !isString(scene.descriptionMd)) {
      return false;
    }
    if (scene.atmosphereMd !== undefined && !isString(scene.atmosphereMd)) return false;
    if (!Array.isArray(scene.hotspots)) return false;
    for (const hotspot of scene.hotspots) {
      if (!isRecord(hotspot)) return false;
      if (
        !isString(hotspot.hotspotId) ||
        !isString(hotspot.label) ||
        !isString(hotspot.descriptionMd) ||
        !isStringArray(hotspot.rewardClueIds)
      ) {
        return false;
      }
    }
  }

  if (!Array.isArray(v.documents)) return false;
  for (const doc of v.documents) {
    if (!isRecord(doc)) return false;
    if (
      !isString(doc.docId) ||
      !isString(doc.title) ||
      !isString(doc.type) ||
      !isString(doc.bodyMd) ||
      !isStringArray(doc.rewardClueIds)
    ) {
      return false;
    }
  }

  if (!Array.isArray(v.clues)) return false;
  for (const clue of v.clues) {
    if (!isRecord(clue)) return false;
    if (!isString(clue.clueId) || !isString(clue.title) || !isString(clue.text)) return false;
    if (clue.detectiveFlavor !== undefined && !isString(clue.detectiveFlavor)) return false;
    if (!isRecord(clue.tags)) return false;
    if (clue.tags.time !== undefined && !isString(clue.tags.time)) return false;
    if (clue.tags.location !== undefined && !isString(clue.tags.location)) return false;
    if (clue.tags.personId !== undefined && !isString(clue.tags.personId)) return false;
    if (!isRecord(clue.source)) return false;
    if (!isString(clue.source.id)) return false;
    if (!["scene", "doc", "interrogation", "document"].includes(String(clue.source.type))) return false;
  }

  if (v.clueConnections !== undefined) {
    if (!Array.isArray(v.clueConnections)) return false;
    for (const connection of v.clueConnections) {
      if (!isRecord(connection)) return false;
      if (
        !isString(connection.connectionId) ||
        !isString(connection.deductionTitle) ||
        !isString(connection.deductionMd)
      ) {
        return false;
      }
      if (!Array.isArray(connection.clueIds) || connection.clueIds.length !== 2) return false;
      if (!connection.clueIds.every(isString)) return false;
      if (connection.revealClueIds !== undefined && !isStringArray(connection.revealClueIds)) return false;
    }
  }

  if (!Array.isArray(v.interrogations)) return false;
  for (const interrogation of v.interrogations) {
    if (!isRecord(interrogation)) return false;
    if (!isString(interrogation.characterId) || !isString(interrogation.startNodeId)) return false;
    if (!Array.isArray(interrogation.nodes)) return false;

    for (const node of interrogation.nodes) {
      if (!isRecord(node)) return false;
      if (!isString(node.nodeId) || !isString(node.speakerId) || !isString(node.text)) return false;
      if (!Array.isArray(node.choices)) return false;
      for (const choice of node.choices) {
        if (!isRecord(choice)) return false;
        if (!isString(choice.choiceId) || !isString(choice.label)) return false;
        if (choice.nextNodeId !== undefined && !isString(choice.nextNodeId)) return false;
        if (choice.evidenceCheck === undefined) continue;

        const evidenceCheck = choice.evidenceCheck;
        if (!isRecord(evidenceCheck)) return false;
        if (
          !isStringArray(evidenceCheck.acceptedClueIds) ||
          !isString(evidenceCheck.successNodeId) ||
          !isString(evidenceCheck.failNodeId)
        ) {
          return false;
        }
        if (evidenceCheck.timeLimitSec !== undefined && !isNumber(evidenceCheck.timeLimitSec)) return false;
        if (evidenceCheck.grantClueIds !== undefined && !isStringArray(evidenceCheck.grantClueIds)) return false;
        if (evidenceCheck.reactionText !== undefined) {
          if (!isRecord(evidenceCheck.reactionText)) return false;
          if (!isString(evidenceCheck.reactionText.success) || !isString(evidenceCheck.reactionText.fail)) {
            return false;
          }
        }
      }
    }
  }

  const timeline = v.timeline;
  if (!isRecord(timeline)) return false;
  if (!Array.isArray(timeline.slots) || !Array.isArray(timeline.solution)) return false;
  for (const slot of timeline.slots) {
    if (!isRecord(slot)) return false;
    if (!isString(slot.slotId) || !isString(slot.label) || !isStringArray(slot.allowedClueIds)) return false;
    if (!isHint(slot.hint)) return false;
  }
  for (const solutionRow of timeline.solution) {
    if (!isRecord(solutionRow)) return false;
    if (!isString(solutionRow.slotId) || !isString(solutionRow.clueId)) return false;
  }

  const report = v.report;
  if (!isRecord(report)) return false;
  if (!isNumber(report.minEvidenceToSubmit) || !Array.isArray(report.questions)) return false;
  for (const question of report.questions) {
    if (!isRecord(question)) return false;
    if (!isString(question.qId) || !isString(question.prompt) || !isString(question.correctOptionId)) {
      return false;
    }
    if (!Array.isArray(question.options) || !Array.isArray(question.requiredClueSets)) return false;
    if (!isHint(question.hint)) return false;

    for (const option of question.options) {
      if (!isRecord(option)) return false;
      if (!isString(option.id) || !isString(option.label)) return false;
      if (option.feedbackMd !== undefined && !isString(option.feedbackMd)) return false;
    }
    for (const clueSet of question.requiredClueSets) {
      if (!isStringArray(clueSet)) return false;
    }
  }

  const explanations = v.explanations;
  if (!isRecord(explanations)) return false;
  if (!isString(explanations.summaryMd) || !isString(explanations.fullSolutionMd)) return false;
  if (explanations.secretEndingMd !== undefined && !isString(explanations.secretEndingMd)) return false;

  const hintPolicy = v.hintPolicy;
  if (!isRecord(hintPolicy)) return false;
  if (!isNumber(hintPolicy.maxUses) || !isNumber(hintPolicy.penaltyPerUse)) return false;

  return true;
}

function normalizeClueSourceType(caseData: CaseSchemaV01): { data: CaseSchemaV01; warnings: string[] } {
  const warnings: string[] = [];
  let changed = false;

  const normalizedClues = (caseData.clues ?? []).map((clue, index) => {
    const sourceType = (clue.source as { type?: string } | undefined)?.type;
    if (sourceType !== "document") return clue;

    changed = true;
    warnings.push(
      `[Normalize] clue(${clue.clueId ?? `index:${index}`}).source.type=document normalized to doc`
    );

    return {
      ...clue,
      source: {
        ...clue.source,
        type: "doc"
      }
    };
  });

  if (!changed) {
    return { data: caseData, warnings };
  }

  return {
    data: {
      ...caseData,
      clues: normalizedClues as CaseSchemaV01["clues"]
    },
    warnings
  };
}

export async function loadCaseById(caseId: string): Promise<CaseLoadResult> {
  try {
    const res = await fetch(`/cases/${caseId}.json`, { cache: "no-store" });
    if (!res.ok) {
      return { ok: false, errors: [`Case file not found: ${caseId}.json`] };
    }

    const raw: unknown = await res.json();
    if (!isCaseSchemaV01(raw)) {
      return { ok: false, errors: [`Invalid schema: ${caseId}.json is not schemaVersion 0.1`] };
    }

    const normalized = normalizeClueSourceType(raw);
    const preflight = validateCasePreflight(normalized.data);
    if (!preflight.ok) {
      return { ok: false, errors: preflight.errors };
    }

    return {
      ok: true,
      data: normalized.data,
      warnings: [...normalized.warnings, ...preflight.warnings]
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, errors: [`Load failed: ${message}`] };
  }
}
