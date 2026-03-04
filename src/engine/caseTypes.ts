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
    narratorVoice?: string; // Opening monologue shown before cold open
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
    atmosphereMd?: string; // Detective's inner monologue on entering a scene
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
    detectiveFlavor?: string; // Detective's internal reaction upon seeing this clue
    tags: { time?: string; location?: string; personId?: string };
    source: { type: SourceType; id: string };
  }[];
  clueConnections?: {
    connectionId: string;
    clueIds: [string, string]; // Exactly two clue IDs that must both be obtained
    deductionTitle: string;    // Short title of the insight
    deductionMd: string;       // The deduction text revealed when both clues are connected
    revealClueIds?: string[];  // Optional bonus clues unlocked by the insight
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
          reactionText?: { success: string; fail: string }; // Dramatic UI text on outcome
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
