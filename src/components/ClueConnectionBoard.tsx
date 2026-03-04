import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { CaseSchemaV01 } from "../engine/caseTypes";
import type { CaseSaveV01 } from "../engine/SaveService";
import { InlineHelp } from "../components/InlineHelp";

interface Props {
    caseData: CaseSchemaV01;
    saveData: CaseSaveV01;
    onDiscover: (connectionId: string, revealClueIds?: string[]) => void;
}

export function ClueConnectionBoard({ caseData, saveData, onDiscover }: Props) {
    const [selectedClueId, setSelectedClueId] = useState<string | null>(null);
    const [flashConnectionId, setFlashConnectionId] = useState<string | null>(null);

    const obtained = new Set(saveData.obtainedClueIds);
    const discovered = new Set(saveData.discoveredConnectionIds);
    const connections = caseData.clueConnections ?? [];

    // Only show clues that have been obtained
    const availableClues = caseData.clues.filter((c) => obtained.has(c.clueId));

    const handleClueClick = (clueId: string) => {
        if (!selectedClueId) {
            setSelectedClueId(clueId);
            return;
        }

        if (selectedClueId === clueId) {
            setSelectedClueId(null);
            return;
        }

        // Check if this pair matches any connection
        const match = connections.find(
            (conn) =>
                (conn.clueIds[0] === selectedClueId && conn.clueIds[1] === clueId) ||
                (conn.clueIds[1] === selectedClueId && conn.clueIds[0] === clueId)
        );

        if (match && !discovered.has(match.connectionId)) {
            onDiscover(match.connectionId, match.revealClueIds ?? []);
            setFlashConnectionId(match.connectionId);
            setTimeout(() => setFlashConnectionId(null), 2000);
        }

        setSelectedClueId(null);
    };

    const getClueTitle = (clueId: string) =>
        caseData.clues.find((c) => c.clueId === clueId)?.title ?? clueId;

    return (
        <section className="panel clue-conn-panel">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                🔗 단서 연결 추론
                <InlineHelp text="상관 관계가 있는 단서 2개를 탭하여 연결하세요. 올바른 조합이면 수사에 도움이 되는 새로운 가설이 도출됩니다." />
            </h3>
            <p className="muted" style={{ fontSize: "0.82rem", marginBottom: 12 }}>
                획득한 단서 두 개를 연결하면 탐정의 새 가설이 드러납니다.
            </p>

            {/* Clue chips */}
            {availableClues.length === 0 ? (
                <p className="muted">아직 획득한 단서가 없습니다.</p>
            ) : (
                <div className="clue-chip-pool">
                    {availableClues.map((clue) => {
                        const isSelected = selectedClueId === clue.clueId;
                        // Is this clue part of any already-discovered connection?
                        const isUsed = connections.some(
                            (conn) =>
                                discovered.has(conn.connectionId) &&
                                conn.clueIds.includes(clue.clueId)
                        );
                        return (
                            <button
                                key={clue.clueId}
                                type="button"
                                className={`clue-chip-btn${isSelected ? " clue-chip-selected" : ""}${isUsed ? " clue-chip-used" : ""}`}
                                onClick={() => handleClueClick(clue.clueId)}
                            >
                                🔎 {clue.title}
                            </button>
                        );
                    })}
                </div>
            )}

            {selectedClueId && (
                <p className="muted" style={{ fontSize: "0.8rem", margin: "8px 0 0" }}>
                    ✋ <strong>{getClueTitle(selectedClueId)}</strong> 선택됨 — 연결할 다른 단서를 클릭하세요.
                </p>
            )}

            {/* Discovered connections */}
            {discovered.size > 0 && (
                <div className="connection-revealed-list">
                    <h4 style={{ color: "var(--accent)", marginBottom: 8 }}>💡 도출된 가설</h4>
                    {connections
                        .filter((conn) => discovered.has(conn.connectionId))
                        .map((conn) => (
                            <div
                                key={conn.connectionId}
                                className={`connection-card${flashConnectionId === conn.connectionId ? " connection-card-new" : ""}`}
                            >
                                <div className="connection-card-header">
                                    <span className="connection-card-title">{conn.deductionTitle}</span>
                                    <div className="connection-clue-refs">
                                        {conn.clueIds.map((cid) => (
                                            <span key={cid} className="connection-clue-ref">
                                                {getClueTitle(cid)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="connection-card-body">
                                    <ReactMarkdown>{conn.deductionMd}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {/* Undiscovered hints (locked) */}
            {connections.filter(
                (conn) =>
                    !discovered.has(conn.connectionId) &&
                    conn.clueIds.every((id) => obtained.has(id))
            ).length > 0 && (
                    <div style={{ marginTop: 12 }}>
                        <p className="muted" style={{ fontSize: "0.78rem" }}>
                            🔒 아직 발견되지 않은 연결 {connections.filter((conn) => !discovered.has(conn.connectionId) && conn.clueIds.every((id) => obtained.has(id))).length}개가 있습니다.
                        </p>
                    </div>
                )}
        </section>
    );
}
