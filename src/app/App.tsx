import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import "../styles/mobile.css";
import { GameProvider, useGame } from "./GameContext";
import type { TabId } from "./state";
import { useSettings } from "./useSettings";
import { useAchievement } from "./useAchievement";
import { BUILD_VERSION } from "./version";
import { playBeep } from "./audio";
import { buildExportPayload, formatDuration, getNextActionGuide } from "./uiHelpers";

import { CaseSelector } from "../components/CaseSelector";
import { OverviewScreen } from "../screens/OverviewScreen";
import { SceneScreen } from "../screens/SceneScreen";
import { DocumentsScreen } from "../screens/DocumentsScreen";
import { InterrogationScreen } from "../screens/InterrogationScreen";
import { BoardReportScreen } from "../screens/BoardReportScreen";
import { InventoryPanel } from "../components/InventoryPanel";
import { TutorialOverlay } from "../components/TutorialOverlay";
import { ClueDetailModal } from "../components/ClueDetailModal";
import { ColdOpenOverlay } from "../components/ColdOpenOverlay";
import { AchievementOverlay } from "../components/AchievementOverlay";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: "overview", icon: "🗂️", label: "사건개요" },
  { id: "scene", icon: "🔍", label: "현장" },
  { id: "docs", icon: "📄", label: "문서" },
  { id: "interrogation", icon: "🎙️", label: "심문" },
  { id: "board-report", icon: "📋", label: "보드" }
];

const INTRO_SEEN_PREFIX = "noir_mvp_intro_seen_";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function BrandTitle() {
  return (
    <div>
      <h1>Noir MVP</h1>
      <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{BUILD_VERSION}</span>
    </div>
  );
}

interface AppHeaderProps {
  onToggleSettings: () => void;
}

/** Shared topbar rendered in every app state (loading / error / main). */
function AppHeader({ onToggleSettings }: AppHeaderProps) {
  return (
    <header className="topbar">
      <BrandTitle />
      <div className="topbar-actions">
        <CaseSelector />
        <button type="button" onClick={onToggleSettings}>설정</button>
      </div>
    </header>
  );
}

interface SettingsPanelProps {
  fontSizeMode: "normal" | "large";
  onFontChange: (mode: "normal" | "large") => void;
  sfxOn: boolean;
  onSfxChange: (on: boolean) => void;
  onExportLog: () => void;
  onRequestResetProgress: () => void;
}

function SettingsPanel({
  fontSizeMode,
  onFontChange,
  sfxOn,
  onSfxChange,
  onExportLog,
  onRequestResetProgress
}: SettingsPanelProps) {
  return (
    <section className="panel settings-panel">
      <label>
        글자 크기
        <select
          value={fontSizeMode}
          onChange={(e) => onFontChange(e.target.value as "normal" | "large")}
        >
          <option value="normal">기본</option>
          <option value="large">확대</option>
        </select>
      </label>
      <label className="inline-check">
        <input type="checkbox" checked={sfxOn} onChange={(e) => onSfxChange(e.target.checked)} />
        효과음 On/Off
      </label>
      <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "4px 0" }} />
      <button type="button" onClick={onExportLog} style={{ textAlign: "center" }}>
        세션 로그 내보내기 (클립보드 복사)
      </button>
      <button
        type="button"
        className="danger-outline"
        onClick={onRequestResetProgress}
      >
        Reset Progress
      </button>
    </section>
  );
}

interface DialogOverlayProps {
  title: string;
  message: ReactNode;
  payload?: string;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
  dangerConfirm?: boolean;
}

function DialogOverlay({
  title,
  message,
  payload,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
  dangerConfirm = false
}: DialogOverlayProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const messageId = useId();

  // Lock body scroll while system dialog is visible.
  useEffect(() => {
    const { body } = document;
    const scrollY = window.scrollY;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      touchAction: body.style.touchAction
    };

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.touchAction = "none";

    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.touchAction = prev.touchAction;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    const prevFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusConfirmButton = window.setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onCancel) {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const modalEl = modalRef.current;
      if (!modalEl) return;

      const focusables = Array.from(
        modalEl.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        )
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusConfirmButton);
      window.removeEventListener("keydown", handleKeyDown);
      prevFocused?.focus();
    };
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel ? onCancel : undefined}>
      <div
        ref={modalRef}
        className="modal system-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <h3 id={titleId}>{title}</h3>
        <p id={messageId} className="muted">{message}</p>
        {payload && (
          <textarea
            className="system-dialog-textarea"
            value={payload}
            readOnly
            aria-label="세션 로그 텍스트"
          />
        )}
        <div className="system-dialog-actions">
          {cancelLabel && onCancel && (
            <button type="button" className="btn-ghost" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            ref={confirmButtonRef}
            className={dangerConfirm ? "danger-outline" : "btn-primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface HUDProps {
  cluesCount: number;
  cluesTotal: number;
  interrogationSuccessCount: number;
  timelineFilledCount: number;
  timelineTotal: number;
  evidenceCount: number;
  evidenceMin: number;
}

function HUD({
  cluesCount,
  cluesTotal,
  interrogationSuccessCount,
  timelineFilledCount,
  timelineTotal,
  evidenceCount,
  evidenceMin
}: HUDProps) {
  const cluesPct = cluesTotal > 0 ? Math.round((cluesCount / cluesTotal) * 100) : 0;
  const timelinePct = timelineTotal > 0 ? Math.round((timelineFilledCount / timelineTotal) * 100) : 0;
  const evidencePct = evidenceMin > 0 ? Math.min(100, Math.round((evidenceCount / evidenceMin) * 100)) : 0;
  return (
    <section className="hud-grid">
      <div className="hud-item">
        <small>단서</small>
        <strong>{cluesCount}/{cluesTotal}</strong>
        <div className="hud-bar"><div className="hud-bar-fill" style={{ width: `${cluesPct}%` }} /></div>
      </div>
      <div className="hud-item">
        <small>심문 성공</small>
        <strong>{interrogationSuccessCount}</strong>
      </div>
      <div className="hud-item">
        <small>타임라인</small>
        <strong>{timelineFilledCount}/{timelineTotal}</strong>
        <div className="hud-bar"><div className="hud-bar-fill" style={{ width: `${timelinePct}%` }} /></div>
      </div>
      <div className="hud-item">
        <small>보고서 근거</small>
        <strong>{evidenceCount}/{evidenceMin}</strong>
        <div className="hud-bar"><div className="hud-bar-fill" style={{ width: `${evidencePct}%`, background: evidenceCount >= evidenceMin ? 'var(--success)' : undefined }} /></div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppShell
// ─────────────────────────────────────────────────────────────────────────────

function AppShell() {
  const {
    caseData,
    saveData,
    clueMap,
    loadErrors,
    loadWarnings,
    gradeResult,
    clearAchievements,
    campaignProgress,
    activeTab,
    setActiveTab,
    selectedSceneId,
    selectedDocId,
    selectedCharacterId,
    selectedClueId,
    setSelectedClueId,
    addClues,
    markDocRead,
    setSelectedSceneId,
    setSelectedDocId,
    setSelectedCharacterId,
    setInterrogationNode,
    placeTimeline,
    clearTimeline,
    setReportAnswer,
    toggleEvidence,
    useHint,
    submitReport,
    consumeClearAchievements,
    registerInterrogationSuccess,
    decreaseTrust,
    discoverConnection,
    appendChatLog,
    resetSave
  } = useGame();

  const { fontSizeMode, setFontSizeMode, sfxOn, setSfxOn } = useSettings();
  const { achievement, showAchievement } = useAchievement(sfxOn);

  const [showSettings, setShowSettings] = useState(false);
  const [coldOpenVisible, setColdOpenVisible] = useState(false);
  const [coldOpenIndex, setColdOpenIndex] = useState(0);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [resetConfirmVisible, setResetConfirmVisible] = useState(false);
  const [exportNotice, setExportNotice] = useState<{ title: string; message: string; payload?: string } | null>(null);

  const prevCaseIdRef = useRef<string | null>(null);
  const prevClueCountRef = useRef(0);

  // ── Cold Open ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!caseData || !saveData) return;
    prevCaseIdRef.current = caseData.caseId;
    prevClueCountRef.current = saveData.obtainedClueIds.length;

    const key = `${INTRO_SEEN_PREFIX}${caseData.caseId}`;
    const wantColdOpen = localStorage.getItem(key) !== "1";
    setColdOpenVisible(wantColdOpen);
    setColdOpenIndex(0);

    if (!wantColdOpen && localStorage.getItem("noir_tutorial_done") !== "1") {
      setTutorialVisible(true);
    }
  }, [caseData?.caseId, saveData?.caseId]);

  const closeColdOpen = useCallback(() => {
    if (!caseData) return;
    localStorage.setItem(`${INTRO_SEEN_PREFIX}${caseData.caseId}`, "1");
    setColdOpenVisible(false);

    if (localStorage.getItem("noir_tutorial_done") !== "1") {
      setTutorialVisible(true);
    }
  }, [caseData]);

  // ── Evidence-acquired achievement ───────────────────────────────────────
  useEffect(() => {
    if (!caseData || !saveData) return;
    if (prevCaseIdRef.current !== caseData.caseId) return;
    const next = saveData.obtainedClueIds.length;
    if (next > prevClueCountRef.current) showAchievement("EVIDENCE ACQUIRED", "good");
    prevClueCountRef.current = next;
  }, [caseData?.caseId, saveData?.obtainedClueIds.length]);

  // ── Report graded achievement ───────────────────────────────────────────
  useEffect(() => {
    if (!gradeResult) return;
    const ok = gradeResult.canSubmit && gradeResult.passed === gradeResult.total;
    showAchievement(ok ? "APPROVED" : "REJECTED", ok ? "good" : "bad");
  }, [gradeResult]);

  // ── Clear/challenge achievements (queued after APPROVED) ───────────────
  useEffect(() => {
    if (clearAchievements.length === 0) return;

    const timers: number[] = [];
    clearAchievements.forEach((label, idx) => {
      const timer = window.setTimeout(() => {
        showAchievement(label, "good");
      }, 1700 * (idx + 1));
      timers.push(timer);
    });

    const clearTimer = window.setTimeout(() => {
      consumeClearAchievements();
    }, 1700 * (clearAchievements.length + 1));
    timers.push(clearTimer);

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [clearAchievements, showAchievement, consumeClearAchievements]);

  const coldOpenSlides = useMemo(() => {
    if (!caseData) return [];
    return [
      { title: caseData.title, body: "비가 멎은 도시에 남은 건 거짓말과 타임스탬프뿐이다." },
      { title: "Cold Open", body: caseData.synopsis },
      { title: "Objective", body: "현장-문서-심문으로 단서를 모아 타임라인을 고정하고 보고서를 제출하라." }
    ];
  }, [caseData]);

  // ── Shared UI props ─────────────────────────────────────────────────────
  const rootClass = `app-root${fontSizeMode === "large" ? " font-large" : ""}`;
  const toggleSettings = useCallback(() => setShowSettings((v) => !v), []);
  const requestResetProgress = useCallback(() => setResetConfirmVisible(true), []);

  const handleExportLog = useCallback(async () => {
    if (!caseData || !saveData) return;
    const payload = buildExportPayload(BUILD_VERSION, caseData.caseId, saveData);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(payload);
      setExportNotice({
        title: "세션 로그 복사 완료",
        message: "테스트 피드백 채널(카톡/디스코드/이슈)에 붙여넣어 전달해주세요."
      });
    } catch {
      setExportNotice({
        title: "클립보드 복사 실패",
        message: "아래 로그를 수동 복사해 테스트 피드백 채널로 전달해주세요.",
        payload
      });
    }
  }, [caseData, saveData]);

  // ── Early-out: error state ──────────────────────────────────────────────
  if (loadErrors.length > 0) {
    return (
      <main className={rootClass}>
        <AppHeader onToggleSettings={toggleSettings} />
        <section className="panel error-panel">
          <h2>케이스 로드/검증 오류</h2>
          {loadErrors.map((err, i) => <p key={`${err}-${i}`}>{err}</p>)}
        </section>
      </main>
    );
  }

  // ── Early-out: loading state ────────────────────────────────────────────
  if (!caseData || !saveData) {
    return (
      <main className={rootClass}>
        <AppHeader onToggleSettings={toggleSettings} />
        <section className="panel"><p>로딩 중...</p></section>
      </main>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────
  const timelineFilledCount = Object.values(saveData.timelinePlacement).filter(Boolean).length;
  const timelineTotal = caseData.timeline.slots.length;

  const nextGuide = getNextActionGuide({
    cluesCount: saveData.obtainedClueIds.length,
    interrogationSuccessCount: saveData.interrogationSuccessCount,
    timelineFilledCount,
    timelineTotal,
    reportEvidenceCount: saveData.reportEvidenceClueIds.length,
    reportEvidenceMin: caseData.report.minEvidenceToSubmit,
    reportSubmitted: saveData.reportSubmitted
  });

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <main className={rootClass}>
      <AppHeader onToggleSettings={toggleSettings} />

      {showSettings && (
        <SettingsPanel
          fontSizeMode={fontSizeMode}
          onFontChange={setFontSizeMode}
          sfxOn={sfxOn}
          onSfxChange={setSfxOn}
          onExportLog={handleExportLog}
          onRequestResetProgress={requestResetProgress}
        />
      )}

      <section className="guide-strip">{nextGuide}</section>

      <HUD
        cluesCount={saveData.obtainedClueIds.length}
        cluesTotal={clueMap.size}
        interrogationSuccessCount={saveData.interrogationSuccessCount}
        timelineFilledCount={timelineFilledCount}
        timelineTotal={timelineTotal}
        evidenceCount={saveData.reportEvidenceClueIds.length}
        evidenceMin={caseData.report.minEvidenceToSubmit}
      />

      {loadWarnings.length > 0 && (
        <section className="panel warning-panel">
          {loadWarnings.map((warn, i) => <p key={`${warn}-${i}`}>{warn}</p>)}
        </section>
      )}

      <section className="content">
        {activeTab === "overview" && (
          <OverviewScreen
            caseData={caseData}
            saveData={saveData}
            campaignProgress={campaignProgress}
          />
        )}

        {activeTab === "scene" && selectedSceneId && (
          <SceneScreen
            caseData={caseData}
            selectedSceneId={selectedSceneId}
            obtainedClueIds={saveData.obtainedClueIds}
            onSelectScene={setSelectedSceneId}
            onClaimHotspot={(_, clueIds) => addClues(clueIds)}
          />
        )}

        {activeTab === "docs" && selectedDocId && (
          <DocumentsScreen
            caseData={caseData}
            selectedDocId={selectedDocId}
            readDocIds={saveData.readDocIds}
            obtainedClueIds={saveData.obtainedClueIds}
            onSelectDoc={setSelectedDocId}
            onReadDoc={markDocRead}
            onClaimDocClues={(_, clueIds) => addClues(clueIds)}
          />
        )}

        {activeTab === "interrogation" && (
          <InterrogationScreen
            caseData={caseData}
            saveData={saveData}
            selectedCharacterId={selectedCharacterId}
            onSelectCharacter={setSelectedCharacterId}
            onMoveNode={setInterrogationNode}
            onGrantClues={addClues}
            onEvidenceSuccess={() => {
              registerInterrogationSuccess();
              showAchievement("LIE DETECTED", "good");
            }}
            onEvidenceFail={(characterId) => {
              decreaseTrust(characterId);
            }}
            onAppendChatLog={appendChatLog}
            playSfx={(type) => {
              if (!sfxOn) return;
              if (type === "success" || type === "clue") playBeep("good");
              else playBeep("bad");
            }}
          />
        )}

        {activeTab === "board-report" && (
          <BoardReportScreen
            caseData={caseData}
            saveData={saveData}
            onPlace={placeTimeline}
            onClear={clearTimeline}
            onDiscover={discoverConnection}
            onSetReportAnswer={setReportAnswer}
            onToggleEvidence={toggleEvidence}
            onUseHint={() => {
              useHint();
              showAchievement("HINT USED", "bad");
            }}
            onSubmit={submitReport}
            onBackToMenu={() => {
              setSelectedClueId(null);
              setActiveTab("overview");
            }}
            onReset={resetSave}
            gradeResult={gradeResult}
          />
        )}
      </section>

      <InventoryPanel
        caseData={caseData}
        obtainedClueIds={saveData.obtainedClueIds}
        reportEvidenceClueIds={saveData.reportEvidenceClueIds}
        onSelectClue={setSelectedClueId}
        onToggleEvidence={activeTab === "board-report" ? toggleEvidence : undefined}
      />

      <nav className="bottom-tabs">
        {TABS.map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            data-testid={`tab-${id}`}
            className={activeTab === id ? "active" : ""}
            onClick={() => setActiveTab(id)}
          >
            <span className="tab-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      <ClueDetailModal
        caseData={caseData}
        clueId={selectedClueId}
        onClose={() => setSelectedClueId(null)}
      />

      {achievement && (
        <AchievementOverlay label={achievement.label} tone={achievement.tone} />
      )}

      {coldOpenVisible && coldOpenSlides.length > 0 && (
        <ColdOpenOverlay
          slides={coldOpenSlides}
          index={coldOpenIndex}
          onNext={() => setColdOpenIndex((i) => Math.min(i + 1, coldOpenSlides.length - 1))}
          onSkip={closeColdOpen}
        />
      )}

      {tutorialVisible && (
        <TutorialOverlay
          onDone={() => {
            localStorage.setItem("noir_tutorial_done", "1");
            setTutorialVisible(false);
          }}
        />
      )}

      {resetConfirmVisible && (
        <DialogOverlay
          title="진행도 초기화"
          message="현재 선택된 케이스의 진행도를 초기화할까요?"
          confirmLabel="초기화"
          cancelLabel="취소"
          dangerConfirm
          onCancel={() => setResetConfirmVisible(false)}
          onConfirm={() => {
            resetSave();
            setResetConfirmVisible(false);
          }}
        />
      )}

      {exportNotice && (
        <DialogOverlay
          title={exportNotice.title}
          message={exportNotice.message}
          payload={exportNotice.payload}
          confirmLabel="확인"
          onConfirm={() => setExportNotice(null)}
          onCancel={() => setExportNotice(null)}
        />
      )}

      <footer className="footer-note">
        <small>
          {nextGuide} | 누적 플레이 {formatDuration(campaignProgress.totalPlaySeconds)}
        </small>
      </footer>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  );
}
