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
                    const labelBits = [meta?.label ?? id];

                    if (!unlocked) {
                        labelBits.push("LOCKED");
                        if (meta?.unlockBy) labelBits.push(`Clear:${meta.unlockBy}`);
                    } else {
                        if ((stats?.completedCount ?? 0) > 0) labelBits.push("CLEAR");
                        if ((stats?.bestRank ?? null) === "S") labelBits.push("PERFECT");
                        if (stats?.challengeFlags?.noHintClear) labelBits.push("NO-HINT");
                        if (stats?.challengeFlags?.tightEvidenceClear) labelBits.push("TIGHT");
                        if (stats?.bestRank) labelBits.push(`R:${stats.bestRank}`);
                        if (stats?.attempts) labelBits.push(`Try:${stats.attempts}`);
                        if (stats?.totalPlaySeconds) {
                            labelBits.push(`T:${formatDuration(stats.totalPlaySeconds)}`);
                        }
                    }

                    return (
                        <option key={id} value={id} disabled={!unlocked}>
                            {labelBits.join(" · ")}
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
                {selectedMeta?.label ?? selectedCaseId} · First {firstClearLabel} · Perfect x{perfectCount}
            </small>
        </div>
    );
}
