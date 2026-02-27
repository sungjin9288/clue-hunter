import { useEffect, useMemo, useState } from "react";
import "../styles/mobile.css";
import type { TabId } from "./state";
import { loadCaseById } from "../engine/CaseLoader";
import { createInitialSave, SaveService, type CaseSaveV01 } from "../engine/SaveService";
import type { CaseSchemaV01 } from "../engine/caseTypes";
import { TimelineEngine } from "../engine/TimelineEngine";
import type { GradeResult } from "../engine/ReportEngine";

import { OverviewScreen } from "../screens/OverviewScreen";
import { SceneScreen } from "../screens/SceneScreen";
import { DocumentsScreen } from "../screens/DocumentsScreen";
import { InterrogationScreen } from "../screens/InterrogationScreen";
import { BoardReportScreen } from "../screens/BoardReportScreen";
import { InventoryPanel } from "../components/InventoryPanel";
import { ClueDetailModal } from "../components/ClueDetailModal";

const CASE_OPTIONS = ["case_000_sandbox", "case_001"];

function dedupe(ids: string[]): string[] {
  return [...new Set(ids)];
}

export default function App() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(CASE_OPTIONS[0]);
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

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoadErrors([]);
      setLoadWarnings([]);
      setCaseData(null);
      setSaveData(null);
      setGradeResult(null);

      const loaded = await loadCaseById(selectedCaseId);
      if (!mounted) return;

      if (!loaded.ok) {
        setLoadErrors(loaded.errors);
        return;
      }

      const c = loaded.data;
      const fallback = createInitialSave(c);
      const existing = SaveService.load(c.caseId);

      setCaseData(c);
      setSaveData(existing ?? fallback);
      setSelectedSceneId(c.scenes[0]?.sceneId ?? null);
      setSelectedDocId(c.documents[0]?.docId ?? null);
      setSelectedCharacterId(c.interrogations[0]?.characterId ?? null);
      setLoadWarnings(loaded.warnings);
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [selectedCaseId]);

  const clueMap = useMemo(
    () => new Map(caseData?.clues.map((c) => [c.clueId, c]) ?? []),
    [caseData]
  );

  const patchSave = (updater: (prev: CaseSaveV01) => CaseSaveV01) => {
    if (!saveData) return;
    const next = updater(saveData);
    setSaveData(next);
    SaveService.save(next);
  };

  const addClues = (clueIds: string[]) => {
    patchSave((prev) => ({
      ...prev,
      obtainedClueIds: dedupe([...prev.obtainedClueIds, ...clueIds])
    }));
  };

  const markDocRead = (docId: string) => {
    patchSave((prev) => ({ ...prev, readDocIds: dedupe([...prev.readDocIds, docId]) }));
  };

  const setInterrogationNode = (characterId: string, nodeId: string) => {
    patchSave((prev) => ({
      ...prev,
      interrogationNodeProgress: {
        ...prev.interrogationNodeProgress,
        [characterId]: nodeId
      }
    }));
  };

  const placeTimeline = (slotId: string, clueId: string) => {
    if (!caseData) return;
    if (!TimelineEngine.canPlace(caseData, slotId, clueId)) return;

    patchSave((prev) => ({
      ...prev,
      timelinePlacement: { ...prev.timelinePlacement, [slotId]: clueId }
    }));
  };

  const clearTimeline = (slotId: string) => {
    patchSave((prev) => ({
      ...prev,
      timelinePlacement: { ...prev.timelinePlacement, [slotId]: null }
    }));
  };

  const setReportAnswer = (qId: string, optionId: string) => {
    patchSave((prev) => ({
      ...prev,
      reportAnswers: {
        ...prev.reportAnswers,
        [qId]: optionId
      }
    }));
  };

  const toggleEvidence = (clueId: string) => {
    patchSave((prev) => {
      const has = prev.reportEvidenceClueIds.includes(clueId);
      return {
        ...prev,
        reportEvidenceClueIds: has
          ? prev.reportEvidenceClueIds.filter((id) => id !== clueId)
          : [...prev.reportEvidenceClueIds, clueId]
      };
    });
  };

  const submitReport = (result: GradeResult) => {
    setGradeResult(result);
    if (!result.canSubmit) return;

    patchSave((prev) => ({ ...prev, reportSubmitted: true }));
  };

  if (loadErrors.length > 0) {
    return (
      <main className="app-root">
        <header className="topbar">
          <h1>Noir MVP</h1>
          <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
            {CASE_OPTIONS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </header>

        <section className="panel error-panel">
          <h2>케이스 로드/검증 오류</h2>
          {loadErrors.map((err, i) => (
            <p key={`${err}-${i}`}>{err}</p>
          ))}
        </section>
      </main>
    );
  }

  if (!caseData || !saveData) {
    return (
      <main className="app-root">
        <header className="topbar">
          <h1>Noir MVP</h1>
          <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
            {CASE_OPTIONS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </header>
        <section className="panel">
          <p>로딩 중...</p>
        </section>
      </main>
    );
  }

  const characterId = selectedCharacterId ?? caseData.interrogations[0]?.characterId;
  const currentNodeId = characterId
    ? saveData.interrogationNodeProgress[characterId] ??
      caseData.interrogations.find((i) => i.characterId === characterId)?.startNodeId ??
      ""
    : "";

  return (
    <main className="app-root">
      <header className="topbar">
        <h1>Noir MVP</h1>
        <div className="toolbar-row">
          <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
            {CASE_OPTIONS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              SaveService.clear(caseData.caseId);
              const fresh = createInitialSave(caseData);
              setSaveData(fresh);
              setGradeResult(null);
            }}
          >
            저장 초기화
          </button>
        </div>
      </header>

      {loadWarnings.length > 0 ? (
        <section className="panel warning-panel">
          {loadWarnings.map((warn, i) => (
            <p key={`${warn}-${i}`}>{warn}</p>
          ))}
        </section>
      ) : null}

      <section className="content">
        {activeTab === "overview" ? <OverviewScreen caseData={caseData} saveData={saveData} /> : null}

        {activeTab === "scene" && selectedSceneId ? (
          <SceneScreen
            caseData={caseData}
            selectedSceneId={selectedSceneId}
            obtainedClueIds={saveData.obtainedClueIds}
            onSelectScene={setSelectedSceneId}
            onClaimHotspot={(_, clueIds) => addClues(clueIds)}
          />
        ) : null}

        {activeTab === "docs" && selectedDocId ? (
          <DocumentsScreen
            caseData={caseData}
            selectedDocId={selectedDocId}
            readDocIds={saveData.readDocIds}
            obtainedClueIds={saveData.obtainedClueIds}
            onSelectDoc={setSelectedDocId}
            onReadDoc={markDocRead}
            onClaimDocClues={(_, clueIds) => addClues(clueIds)}
          />
        ) : null}

        {activeTab === "interrogation" && characterId ? (
          <>
            <section className="panel">
              <label>
                심문 대상
                <select
                  value={characterId}
                  onChange={(e) => {
                    setSelectedCharacterId(e.target.value);
                    SaveService.save(saveData);
                  }}
                >
                  {caseData.interrogations.map((i) => (
                    <option key={i.characterId} value={i.characterId}>
                      {i.characterId}
                    </option>
                  ))}
                </select>
              </label>
            </section>
            <InterrogationScreen
              caseData={caseData}
              characterId={characterId}
              currentNodeId={currentNodeId}
              obtainedClueIds={saveData.obtainedClueIds}
              onMoveNode={setInterrogationNode}
              onGrantClues={addClues}
            />
          </>
        ) : null}

        {activeTab === "board-report" ? (
          <BoardReportScreen
            caseData={caseData}
            saveData={saveData}
            onPlace={placeTimeline}
            onClear={clearTimeline}
            onSetReportAnswer={setReportAnswer}
            onToggleEvidence={toggleEvidence}
            onSubmit={submitReport}
            gradeResult={gradeResult}
          />
        ) : null}
      </section>

      <InventoryPanel
        caseData={caseData}
        obtainedClueIds={saveData.obtainedClueIds}
        reportEvidenceClueIds={saveData.reportEvidenceClueIds}
        onSelectClue={setSelectedClueId}
        onToggleEvidence={activeTab === "board-report" ? toggleEvidence : undefined}
      />

      <nav className="bottom-tabs">
        {[
          ["overview", "사건개요"],
          ["scene", "현장"],
          ["docs", "문서"],
          ["interrogation", "심문"],
          ["board-report", "보드&보고서"]
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? "active" : ""}
            onClick={() => {
              setActiveTab(id as TabId);
              SaveService.save(saveData);
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <ClueDetailModal caseData={caseData} clueId={selectedClueId} onClose={() => setSelectedClueId(null)} />

      <footer className="footer-note">
        <small>
          진행률: 단서 {saveData.obtainedClueIds.length}/{clueMap.size} | 힌트 사용 {saveData.hintUses}/
          {caseData.hintPolicy.maxUses}
        </small>
      </footer>
    </main>
  );
}
