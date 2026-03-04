import { useCallback, useEffect, useRef, useState } from "react";
import type { CaseSchemaV01 } from "../engine/caseTypes";
import type { CaseSaveV01, ChatLogEntry } from "../engine/SaveService";
import { InterrogationEngine } from "../engine/InterrogationEngine";
import { TrustMeter } from "../components/TrustMeter";
import { InlineHelp } from "../components/InlineHelp";

interface Props {
  caseData: CaseSchemaV01;
  saveData: CaseSaveV01;
  selectedCharacterId: string | null;
  onSelectCharacter: (characterId: string) => void;
  onMoveNode: (characterId: string, nodeId: string) => void;
  onGrantClues: (clueIds: string[]) => void;
  onEvidenceSuccess: () => void;
  onEvidenceFail: (characterId: string) => void;
  onAppendChatLog: (characterId: string, entry: ChatLogEntry) => void;
  playSfx: (type: "beep" | "clue" | "success" | "fail") => void;
}

export function InterrogationScreen({
  caseData,
  saveData,
  selectedCharacterId,
  onSelectCharacter,
  onMoveNode,
  onGrantClues,
  onEvidenceSuccess,
  onEvidenceFail,
  onAppendChatLog,
  playSfx
}: Props) {
  const firstCharacterId = caseData.interrogations[0]?.characterId ?? "";
  const characterId = selectedCharacterId ?? firstCharacterId;

  const [dragOverChoiceId, setDragOverChoiceId] = useState<string | null>(null);
  const [selectedEvidenceClueId, setSelectedEvidenceClueId] = useState<string | null>(null);
  const [animState, setAnimState] = useState<"shake" | "flash" | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);

  // Resolve character display name
  const allCharacters = [
    caseData.characters.victim,
    ...caseData.characters.suspects,
    ...caseData.characters.witnesses
  ];
  const getCharName = (id: string) =>
    allCharacters.find((c) => c.id === id)?.name ?? id;

  const currentNodeId =
    saveData.interrogationNodeProgress[characterId] ??
    caseData.interrogations.find((i) => i.characterId === characterId)?.startNodeId ??
    "";

  const node = InterrogationEngine.getNode(caseData, characterId, currentNodeId);

  // Per-character persisted chat log
  const chatHistory: ChatLogEntry[] = saveData.chatLog[characterId] ?? [];

  // Scroll to bottom whenever log changes or character switches
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory.length, characterId]);

  const handleCharacterChange = (newId: string) => {
    onSelectCharacter(newId);
  };

  useEffect(() => {
    setDragOverChoiceId(null);
    setSelectedEvidenceClueId(null);
  }, [characterId, node?.nodeId]);

  const availableEvidenceClues = saveData.obtainedClueIds
    .map((clueId) => caseData.clues.find((clue) => clue.clueId === clueId))
    .filter((clue): clue is CaseSchemaV01["clues"][number] => Boolean(clue));

  // Typewriter effect: re-run whenever the node text changes
  useEffect(() => {
    if (!node?.text) { setDisplayedText(""); setTypingDone(false); return; }
    setDisplayedText("");
    setTypingDone(false);
    let i = 0;
    const text = node.text;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setTypingDone(true);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [node?.text, node?.nodeId]);

  const triggerAnim = (type: "shake" | "flash") => {
    setAnimState(type);
    setTimeout(() => setAnimState(null), 600);
  };

  const handleChoiceClick = useCallback((choiceId: string, _choiceLabel: string) => {
    if (!node) return;
    const choice = node.choices.find((c) => c.choiceId === choiceId);
    if (!choice || choice.evidenceCheck) return; // Evidence choices require drag-drop

    onAppendChatLog(characterId, { speaker: "player", text: choice.label, type: "player" });

    const applied = InterrogationEngine.applyChoice({
      caseData,
      characterId,
      currentNodeId,
      choiceId,
      presentedClueId: ""
    });

    if (!applied.ok) {
      triggerAnim("flash");
      playSfx("fail");
      return;
    }

    onMoveNode(characterId, applied.nextNodeId);
    if (applied.grantClueIds.length > 0) onGrantClues(applied.grantClueIds);

    // Log the NPC's response
    const nextNode = InterrogationEngine.getNode(caseData, characterId, applied.nextNodeId);
    if (nextNode) {
      onAppendChatLog(characterId, {
        speaker: nextNode.speakerId,
        text: nextNode.text,
        type: "npc"
      });
    }

    if (applied.evidenceSuccess === true) {
      onEvidenceSuccess();
      triggerAnim("shake");
      playSfx("success");
    } else {
      playSfx("beep");
    }
  }, [node, characterId, currentNodeId, caseData, onAppendChatLog, onMoveNode, onGrantClues, onEvidenceSuccess, playSfx]);

  const submitEvidenceChoice = useCallback((choiceId: string, clueId: string) => {
    if (!node) return;
    const droppedChoice = node.choices.find((c) => c.choiceId === choiceId);
    if (!droppedChoice?.evidenceCheck) return;

    setSelectedEvidenceClueId(null);
    // Find dropped clue title for the log
    const clueTitle = caseData.clues.find((c) => c.clueId === clueId)?.title ?? clueId;
    onAppendChatLog(characterId, {
      speaker: "player",
      text: `🔎 증거 제시: ${clueTitle}`,
      type: "player"
    });

    const applied = InterrogationEngine.applyChoice({
      caseData,
      characterId,
      currentNodeId,
      choiceId,
      presentedClueId: clueId
    });

    if (!applied.ok) {
      triggerAnim("flash");
      playSfx("fail");
      onEvidenceFail(characterId);
      onAppendChatLog(characterId, {
        speaker: "system",
        text: "❌ " + applied.error,
        type: "system"
      });
      return;
    }

    onMoveNode(characterId, applied.nextNodeId);
    if (applied.grantClueIds.length > 0) onGrantClues(applied.grantClueIds);

    const nextNode = InterrogationEngine.getNode(caseData, characterId, applied.nextNodeId);
    if (nextNode) {
      onAppendChatLog(characterId, {
        speaker: nextNode.speakerId,
        text: nextNode.text,
        type: "npc"
      });
    }

    if (applied.evidenceSuccess === true) {
      onEvidenceSuccess();
      const successReaction = droppedChoice?.evidenceCheck?.reactionText?.success;
      if (successReaction) {
        onAppendChatLog(characterId, {
          speaker: "system",
          text: successReaction,
          type: "system"
        });
      }
      onAppendChatLog(characterId, { speaker: "system", text: "✅ 증거 제시 성공! 상대가 동요합니다.", type: "system" });
      triggerAnim("shake");
      playSfx("success");
    } else {
      // Wrong evidence should always reduce trust.
      onEvidenceFail(characterId);
      const failReaction = droppedChoice?.evidenceCheck?.reactionText?.fail;
      if (failReaction) {
        onAppendChatLog(characterId, {
          speaker: "system",
          text: failReaction,
          type: "system"
        });
      } else {
        onAppendChatLog(characterId, {
          speaker: "system",
          text: "❌ 단서 제시 실패. 신뢰도가 하락합니다.",
          type: "system"
        });
      }
      triggerAnim("flash");
      playSfx("fail");
    }
  }, [
    node,
    caseData,
    characterId,
    currentNodeId,
    onAppendChatLog,
    onMoveNode,
    onGrantClues,
    onEvidenceFail,
    onEvidenceSuccess,
    playSfx
  ]);

  const handleDropEvidence = (e: React.DragEvent, choiceId: string) => {
    e.preventDefault();
    setDragOverChoiceId(null);
    const droppedClueId = e.dataTransfer.getData("text/plain");
    if (!droppedClueId) return;
    submitEvidenceChoice(choiceId, droppedClueId);
  };

  const animClass = animState === "shake" ? "anim-shake" : animState === "flash" ? "anim-flash-red" : "";
  const isLocked = (saveData.trustLevels[characterId] ?? 3) === 0;

  return (
    <section className={`panel ${animClass}`}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        🎙️ 심문
        <InlineHelp text="질문을 고르거나 단서를 드래그/선택해 증거를 제시하세요. 틀린 단서를 대면 신뢰도(❤️)가 깎입니다." />
      </h2>

      {/* Trust meters row */}
      <div className="trust-meter-row">
        {caseData.interrogations.map((i) => {
          const trust = saveData.trustLevels[i.characterId] ?? 3;
          return (
            <TrustMeter
              key={i.characterId}
              characterName={getCharName(i.characterId)}
              trust={trust}
            />
          );
        })}
      </div>

      {/* Character selector */}
      <label className="char-select-label">
        심문 대상&nbsp;
        <select value={characterId} onChange={(e) => handleCharacterChange(e.target.value)}>
          {caseData.interrogations.map((i) => {
            const trust = saveData.trustLevels[i.characterId] ?? 3;
            return (
              <option key={i.characterId} value={i.characterId}>
                {getCharName(i.characterId)}{trust === 0 ? " 🔒" : ""}
              </option>
            );
          })}
        </select>
      </label>

      {/* Locked state */}
      {isLocked && (
        <div className="trust-locked-panel">
          <p>🔒 <strong>{getCharName(characterId)}</strong>이(가) 입을 닫았습니다.</p>
          <p className="muted">잘못된 증거를 너무 많이 제시해 신뢰를 잃었습니다.</p>
        </div>
      )}

      {/* ── Chat log window ── */}
      <div className="chat-log-window">
        {chatHistory.length === 0 && (
          <p className="muted chat-log-empty">아직 대화가 없습니다. 질문을 시작하세요.</p>
        )}
        {chatHistory.map((entry, idx) => (
          <div
            key={idx}
            className={`chat-bubble chat-bubble-${entry.type}`}
          >
            {entry.type === "npc" && (
              <span className="chat-speaker">🎙 {getCharName(entry.speaker)}</span>
            )}
            {entry.type === "player" && (
              <span className="chat-speaker chat-speaker-player">🕵️ 탐정</span>
            )}
            {entry.type === "system" && (
              <span className="chat-speaker chat-speaker-system">⚙</span>
            )}
            <p className="chat-text">{entry.text}</p>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* ── Live dialog node (current) ── */}
      {!node ? (
        <p className="muted">노드를 찾을 수 없습니다: {currentNodeId}</p>
      ) : (
        <>
          {/* Current NPC line with typewriter */}
          {chatHistory.length === 0 && (
            <article className="dialog-box">
              <strong style={{ display: "block", marginBottom: 6, color: "var(--accent)" }}>
                🎙 {getCharName(node.speakerId)}
              </strong>
              <p className={`npc-text${typingDone ? " done" : ""}`}>{displayedText}</p>
            </article>
          )}

          {node.choices.length === 0 && (
            <p className="muted">더 이상 선택지가 없습니다.</p>
          )}

          {!isLocked && (
            <>
              {node.choices.some((choice) => Boolean(choice.evidenceCheck)) && (
                <section className="evidence-picker">
                  <p className="muted evidence-picker-title">
                    증거 선택(탭) 또는 인벤토리에서 드래그
                  </p>
                  <div className="evidence-picker-grid">
                    {availableEvidenceClues.length === 0 && (
                      <span className="muted">제시 가능한 단서가 아직 없습니다.</span>
                    )}
                    {availableEvidenceClues.map((clue) => (
                      <button
                        key={clue.clueId}
                        type="button"
                        className={`evidence-chip-btn${selectedEvidenceClueId === clue.clueId ? " active" : ""}`}
                        onClick={() =>
                          setSelectedEvidenceClueId((prev) => (prev === clue.clueId ? null : clue.clueId))
                        }
                      >
                        {clue.title}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <div className="choices">
                {node.choices.map((choice) => {
                  const isEvidence = !!choice.evidenceCheck;
                  const isDragOver = dragOverChoiceId === choice.choiceId;
                  return (
                    <div
                      key={choice.choiceId}
                      className={`choice-card${isDragOver ? " drag-over" : ""}${isEvidence ? " evidence-choice" : ""}`}
                      draggable={false}
                      onDragOver={(e) => {
                        if (!isEvidence) return;
                        e.preventDefault();
                        setDragOverChoiceId(choice.choiceId);
                      }}
                      onDragLeave={() => setDragOverChoiceId(null)}
                      onDrop={(e) => isEvidence && handleDropEvidence(e, choice.choiceId)}
                      onClick={() => {
                        if (!isEvidence) {
                          handleChoiceClick(choice.choiceId, choice.label);
                          return;
                        }
                        if (!selectedEvidenceClueId) {
                          triggerAnim("flash");
                          playSfx("fail");
                          onAppendChatLog(characterId, {
                            speaker: "system",
                            text: "🗂 먼저 제시할 단서를 탭 선택하거나 드래그하세요.",
                            type: "system"
                          });
                          return;
                        }
                        submitEvidenceChoice(choice.choiceId, selectedEvidenceClueId);
                      }}
                    >
                      <span className="choice-label">{choice.label}</span>
                      {isEvidence && (
                        <span className="choice-hint">
                          {isDragOver
                            ? "✅ 여기에 놓으세요"
                            : selectedEvidenceClueId
                              ? "✅ 선택된 단서로 탭 제출 가능"
                              : "🗂 단서를 여기로 드래그 또는 위에서 탭 선택"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
