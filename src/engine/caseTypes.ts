export type SourceType = "scene" | "doc" | "interrogation";

export interface CaseSchemaV01 {
  schemaVersion: "0.1";
  caseId: string;
  title: string;
  synopsis: string;
  meta: {
    tone: "hardboiled";
    estimatedMinutes: number;
    difficulty: number;
  };
  characters: {
    victim: { id: "victim"; name: string; bio: string; lockedBio?: { text: string; unlockClueId: string }[] };
    suspects: { id: string; name: string; bio: string; alibiClaim: string; lockedBio?: { text: string; unlockClueId: string }[] }[];
    witnesses: { id: string; name: string; bio: string; lockedBio?: { text: string; unlockClueId: string }[] }[];
  };
  scenes: {
    sceneId: string;
    title: string;
    descriptionMd: string;
    hotspots: {
      hotspotId: string;
      label: string;
      descriptionMd: string;
      rewardClueIds: string[];
    }[];
  }[];
  documents: {
    docId: string;
    title: string;
    type: string;
    bodyMd: string;
    rewardClueIds: string[];
  }[];
  clues: {
    clueId: string;
    title: string;
    text: string;
    tags: { time?: string; location?: string; personId?: string };
    source: { type: SourceType; id: string };
  }[];
  interrogations: {
    characterId: string;
    startNodeId: string;
    nodes: {
      nodeId: string;
      speakerId: string;
      text: string;
      choices: {
        choiceId: string;
        label: string;
        nextNodeId?: string;
        evidenceCheck?: {
          timeLimitSec?: number;
          acceptedClueIds: string[];
          successNodeId: string;
          failNodeId: string;
          grantClueIds?: string[];
        };
      }[];
    }[];
  }[];
  timeline: {
    slots: {
      slotId: string;
      label: string;
      allowedClueIds: string[];
      hint: { l1: string; l2: string; l3: string };
    }[];
    solution: { slotId: string; clueId: string }[];
  };
  report: {
    minEvidenceToSubmit: number;
    questions: {
      qId: string;
      prompt: string;
      options: { id: string; label: string; feedbackMd?: string }[];
      correctOptionId: string;
      requiredClueSets: string[][];
      hint: { l1: string; l2: string; l3: string };
    }[];
  };
  explanations: {
    summaryMd: string;
    fullSolutionMd: string;
    secretEndingMd?: string;
  };
  hintPolicy: {
    maxUses: number;
    penaltyPerUse: number;
  };
}

export interface ValidationIssue {
  type: "error" | "warning";
  message: string;
}
