import { useGame } from "../app/GameContext";

function formatDuration(seconds: number): string {
    if (seconds <= 0) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h <= 0) return `${m}m`;
    return `${h}h ${m}m`;
}

export function CaseSelector() {
    const {
        caseOptions,
        selectedCaseId,
        setSelectedCaseId,
        caseData,
        resetSave,
        campaignProgress,
        caseCatalog,
        caseUnlockMap
    } = useGame();

    const lockedCount = caseOptions.filter((id) => !caseUnlockMap[id]).length;
    const selectedStats = campaignProgress.cases[selectedCaseId];
    const selectedMeta = caseCatalog[selectedCaseId];
    const selectedAttempts = selectedStats?.attempts ?? 0;
    const selectedCompletions = selectedStats?.completedCount ?? 0;
    const selectedBestRank = selectedStats?.bestRank ?? "-";
    const selectedPlayTime = formatDuration(selectedStats?.totalPlaySeconds ?? 0);
    const firstClearLabel = selectedStats?.firstClearedAt
        ? new Date(selectedStats.firstClearedAt).toLocaleString()
        : "-";
    const perfectCount = selectedStats?.perfectClearCount ?? 0;

    return (
        <div className="toolbar-row case-selector-wrap">
            <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
                {caseOptions.map((id) => {
                    const stats = campaignProgress.cases[id];
                    const meta = caseCatalog[id];
                    const unlocked = caseUnlockMap[id];
                    const shortStatus = !unlocked
                        ? "🔒"
                        : (stats?.completedCount ?? 0) > 0
                            ? `✅${stats?.bestRank ? ` ${stats.bestRank}` : ""}`
                            : (stats?.attempts ?? 0) > 0
                                ? "• 진행중"
                                : "";
                    const label = [meta?.label ?? id, shortStatus].filter(Boolean).join(" ");

                    return (
                        <option key={id} value={id} disabled={!unlocked}>
                            {label}
                        </option>
                    );
                })}
            </select>
            {caseData ? (
                <button type="button" onClick={resetSave}>
                    Reset Progress
                </button>
            ) : null}
            {lockedCount > 0 ? <small className="muted">{lockedCount}개 케이스 잠김</small> : null}
            <small
                className="muted case-meta-line"
                title={`First Clear: ${firstClearLabel} | Perfect Clears: ${perfectCount}`}
            >
                {selectedMeta?.label ?? selectedCaseId} · 시도 {selectedAttempts} · 완료 {selectedCompletions}
                {" · "}최고 {selectedBestRank} · 플레이 {selectedPlayTime}
            </small>
            <small className="muted case-meta-line">
                First {firstClearLabel} · Perfect x{perfectCount}
            </small>
        </div>
    );
}
