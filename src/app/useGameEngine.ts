import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TabId } from "./state";
import { loadCaseById } from "../engine/CaseLoader";
import {
  createInitialSave,
  SaveService,
  type CampaignProgressV01,
  type CaseSaveV01
} from "../engine/SaveService";
import type { CaseSchemaV01 } from "../engine/caseTypes";
import { TimelineEngine } from "../engine/TimelineEngine";
import type { GradeResult } from "../engine/ReportEngine";

const CASE_OPTIONS = [
  "case_000_sandbox",
  "case_001",
  "case_002",
  "case_003",
  "case_004",
  "case_005",
  "case_006",
  "case_007",
  "case_008",
  "case_009",
  "case_010",
  "case_011",
  "case_012",
  "case_013",
  "case_014",
  "case_015",
  "case_016"
] as const;

type CaseId = (typeof CASE_OPTIONS)[number];

interface CaseCatalogEntry {
  label: string;
  estimatedMinutes: number;
  unlockBy?: CaseId;
}

const CASE_CATALOG: Record<CaseId, CaseCatalogEntry> = {
  case_000_sandbox: {
    label: "Sandbox",
    estimatedMinutes: 5
  },
  case_001: {
    label: "Midnight Backdoor",
    estimatedMinutes: 45
  },
  case_002: {
    label: "Neon Alibi",
    estimatedMinutes: 55,
    unlockBy: "case_001"
  },
  case_003: {
    label: "Ashen Witness",
    estimatedMinutes: 60,
    unlockBy: "case_002"
  },
  case_004: {
    label: "Glass Contraband",
    estimatedMinutes: 62,
    unlockBy: "case_003"
  },
  case_005: {
    label: "Rainline Betrayal",
    estimatedMinutes: 65,
    unlockBy: "case_004"
  },
  case_006: {
    label: "Blue Ledger",
    estimatedMinutes: 68,
    unlockBy: "case_005"
  },
  case_007: {
    label: "Silent Dockyard",
    estimatedMinutes: 71,
    unlockBy: "case_006"
  },
  case_008: {
    label: "Last Umbra",
    estimatedMinutes: 74,
    unlockBy: "case_007"
  },
  case_009: {
    label: "Hollow Checkpoint",
    estimatedMinutes: 78,
    unlockBy: "case_008"
  },
  case_010: {
    label: "Pale Trigger",
    estimatedMinutes: 82,
    unlockBy: "case_009"
  },
  case_011: {
    label: "Burnt Envelope",
    estimatedMinutes: 86,
    unlockBy: "case_010"
  },
  case_012: {
    label: "Dead Frequency",
    estimatedMinutes: 90,
    unlockBy: "case_011"
  },
  case_013: {
    label: "Redacted Mercy",
    estimatedMinutes: 94,
    unlockBy: "case_012"
  },
  case_014: {
    label: "Last Transit",
    estimatedMinutes: 98,
    unlockBy: "case_013"
  },
  case_015: {
    label: "Null Testament",
    estimatedMinutes: 102,
    unlockBy: "case_014"
  },
  case_016: {
    label: "Midnight Doctrine",
    estimatedMinutes: 106,
    unlockBy: "case_015"
  }
};

function dedupe(ids: string[]): string[] {
  return [...new Set(ids)];
}

function buildCaseUnlockMap(campaign: CampaignProgressV01): Record<string, boolean> {
  const map: Record<string, boolean> = {};

  for (const caseId of CASE_OPTIONS) {
    if (caseId === "case_000_sandbox" || caseId === "case_001") {
      map[caseId] = true;
      continue;
    }

    const unlockBy = CASE_CATALOG[caseId].unlockBy;
    if (!unlockBy) {
      map[caseId] = true;
      continue;
    }

    const completed = campaign.cases[unlockBy]?.completedCount ?? 0;
    map[caseId] = completed > 0;
  }

  return map;
}

function firstUnlockedCase(caseUnlockMap: Record<string, boolean>): string {
  return CASE_OPTIONS.find((id) => caseUnlockMap[id]) ?? CASE_OPTIONS[0];
}

export interface GameEngineValue {
  /* data */
  caseData: CaseSchemaV01 | null;
  saveData: CaseSaveV01 | null;
  clueMap: Map<string, CaseSchemaV01["clues"][number]>;
  loadErrors: string[];
  loadWarnings: string[];
  gradeResult: GradeResult | null;
  clearAchievements: string[];
  caseOptions: readonly string[];
  caseCatalog: Record<string, CaseCatalogEntry>;
  caseUnlockMap: Record<string, boolean>;
  campaignProgress: CampaignProgressV01;
  /* navigation */
  selectedCaseId: string;
  activeTab: TabId;
  selectedSceneId: string | null;
  selectedDocId: string | null;
  selectedCharacterId: string | null;
  selectedClueId: string | null;
  setSelectedCaseId: (id: string) => void;
  setActiveTab: (tab: TabId) => void;
  setSelectedSceneId: (id: string) => void;
  setSelectedDocId: (id: string) => void;
  setSelectedCharacterId: (id: string) => void;
  setSelectedClueId: (id: string | null) => void;
  /* actions */
  addClues: (clueIds: string[]) => void;
  markDocRead: (docId: string) => void;
  setInterrogationNode: (characterId: string, nodeId: string) => void;
  placeTimeline: (slotId: string, clueId: string) => void;
  clearTimeline: (slotId: string) => void;
  setReportAnswer: (qId: string, optionId: string) => void;
  toggleEvidence: (clueId: string) => void;
  useHint: () => void;
  submitReport: (result: GradeResult) => void;
  consumeClearAchievements: () => void;
  registerInterrogationSuccess: () => void;
  resetSave: () => void;
}

export function useGameEngine(): GameEngineValue {
  const [campaignProgress, setCampaignProgress] = useState<CampaignProgressV01>(
    SaveService.loadCampaign()
  );

  const caseUnlockMap = useMemo(
    () => buildCaseUnlockMap(campaignProgress),
    [campaignProgress]
  );

  const [selectedCaseIdState, setSelectedCaseIdState] = useState<string>(
    firstUnlockedCase(caseUnlockMap)
  );
  const [caseData, setCaseData] = useState<CaseSchemaV01 | null>(null);
  const [saveData, setSaveData] = useState<CaseSaveV01 | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedClueId, setSelectedClueId] = useState<string | null>(null);

  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [loadWarnings, setLoadWarnings] = useState<string[]>([]);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [clearAchievements, setClearAchievements] = useState<string[]>([]);

  const activeSessionCaseIdRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);

  const flushSessionPlaytime = useCallback(() => {
    const caseId = activeSessionCaseIdRef.current;
    const startedAt = sessionStartedAtRef.current;
    if (!caseId || !startedAt) return;

    const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
    if (elapsedSec > 0) {
      setCampaignProgress(SaveService.addCasePlaySeconds(caseId, elapsedSec));
    }

    sessionStartedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!caseUnlockMap[selectedCaseIdState]) {
      setSelectedCaseIdState(firstUnlockedCase(caseUnlockMap));
    }
  }, [caseUnlockMap, selectedCaseIdState]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      flushSessionPlaytime();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [flushSessionPlaytime]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      flushSessionPlaytime();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [flushSessionPlaytime]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoadErrors([]);
      setLoadWarnings([]);
      setCaseData(null);
      setSaveData(null);
      setGradeResult(null);
      setClearAchievements([]);

      const loaded = await loadCaseById(selectedCaseIdState);
      if (!mounted) return;

      if (!loaded.ok) {
        setLoadErrors(loaded.errors);
        return;
      }

      const c = loaded.data;
      const existing = SaveService.load(c.caseId);
      const fallback = createInitialSave(c);

      if (activeSessionCaseIdRef.current && activeSessionCaseIdRef.current !== c.caseId) {
        flushSessionPlaytime();
      }

      setCaseData(c);
      setSaveData(existing ?? fallback);
      setSelectedSceneId(c.scenes[0]?.sceneId ?? null);
      setSelectedDocId(c.documents[0]?.docId ?? null);
      setSelectedCharacterId(c.interrogations[0]?.characterId ?? null);
      setLoadWarnings(loaded.warnings);

      activeSessionCaseIdRef.current = c.caseId;
      sessionStartedAtRef.current = Date.now();
      setCampaignProgress(SaveService.markCaseOpened(c.caseId));
    };

    void run();
    return () => {
      mounted = false;
      flushSessionPlaytime();
    };
  }, [selectedCaseIdState, flushSessionPlaytime]);

  const clueMap = useMemo(
    () => new Map(caseData?.clues.map((c) => [c.clueId, c]) ?? []),
    [caseData]
  );

  const setSelectedCaseId = (id: string) => {
    if (!caseUnlockMap[id]) return;
    setSelectedCaseIdState(id);
  };

  const patch = (updater: (prev: CaseSaveV01) => CaseSaveV01) => {
    setSaveData((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      SaveService.save(next);
      return next;
    });
  };

  const addClues = (clueIds: string[]) =>
    patch((prev) => ({
      ...prev,
      obtainedClueIds: dedupe([...prev.obtainedClueIds, ...clueIds])
    }));

  const markDocRead = (docId: string) =>
    patch((prev) => ({ ...prev, readDocIds: dedupe([...prev.readDocIds, docId]) }));

  const setInterrogationNode = (characterId: string, nodeId: string) =>
    patch((prev) => ({
      ...prev,
      interrogationNodeProgress: { ...prev.interrogationNodeProgress, [characterId]: nodeId }
    }));

  const placeTimeline = (slotId: string, clueId: string) => {
    if (!caseData || !TimelineEngine.canPlace(caseData, slotId, clueId)) return;
    patch((prev) => ({
      ...prev,
      timelinePlacement: { ...prev.timelinePlacement, [slotId]: clueId }
    }));
  };

  const clearTimeline = (slotId: string) =>
    patch((prev) => ({
      ...prev,
      timelinePlacement: { ...prev.timelinePlacement, [slotId]: null }
    }));

  const setReportAnswer = (qId: string, optionId: string) =>
    patch((prev) => ({
      ...prev,
      reportAnswers: { ...prev.reportAnswers, [qId]: optionId }
    }));

  const toggleEvidence = (clueId: string) =>
    patch((prev) => {
      const has = prev.reportEvidenceClueIds.includes(clueId);
      return {
        ...prev,
        reportEvidenceClueIds: has
          ? prev.reportEvidenceClueIds.filter((id) => id !== clueId)
          : [...prev.reportEvidenceClueIds, clueId]
      };
    });

  const useHint = () => {
    if (!caseData) return;
    patch((prev) => {
      if (prev.hintUses >= caseData.hintPolicy.maxUses) return prev;
      return {
        ...prev,
        hintUses: prev.hintUses + 1
      };
    });
  };

  const submitReport = (result: GradeResult) => {
    setGradeResult(result);
    if (!result.canSubmit) return;
    patch((prev) => ({ ...prev, reportSubmitted: true }));

    const fullyPassed = result.total > 0 && result.passed === result.total;
    if (caseData && saveData && fullyPassed) {
      const clearUpdate = SaveService.recordCaseClear({
        caseId: caseData.caseId,
        rank: result.rank,
        hintUses: saveData.hintUses,
        evidenceCount: saveData.reportEvidenceClueIds.length,
        minEvidenceCount: caseData.report.minEvidenceToSubmit
      });
      setCampaignProgress(clearUpdate.campaign);
      setClearAchievements(clearUpdate.clearBadges);
    } else {
      setClearAchievements([]);
    }
  };

  const consumeClearAchievements = () => {
    setClearAchievements([]);
  };

  const registerInterrogationSuccess = () =>
    patch((prev) => ({
      ...prev,
      interrogationSuccessCount: prev.interrogationSuccessCount + 1
    }));

  const resetSave = () => {
    if (!caseData) return;
    SaveService.clear(caseData.caseId);
    setSaveData(createInitialSave(caseData));
    setGradeResult(null);
    setClearAchievements([]);
  };

  return {
    caseData,
    saveData,
    clueMap,
    loadErrors,
    loadWarnings,
    gradeResult,
    clearAchievements,
    caseOptions: CASE_OPTIONS,
    caseCatalog: CASE_CATALOG,
    caseUnlockMap,
    campaignProgress,
    selectedCaseId: selectedCaseIdState,
    activeTab,
    selectedSceneId,
    selectedDocId,
    selectedCharacterId,
    selectedClueId,
    setSelectedCaseId,
    setActiveTab,
    setSelectedSceneId,
    setSelectedDocId,
    setSelectedCharacterId,
    setSelectedClueId,
    addClues,
    markDocRead,
    setInterrogationNode,
    placeTimeline,
    clearTimeline,
    setReportAnswer,
    toggleEvidence,
    useHint,
    submitReport,
    consumeClearAchievements,
    registerInterrogationSuccess,
    resetSave
  };
}
