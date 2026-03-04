import { useEffect, useState } from "react";
import type { CaseSchemaV01 } from "../engine/caseTypes";
import type { CaseSaveV01 } from "../engine/SaveService";
import { InterrogationEngine } from "../engine/InterrogationEngine";

interface Props {
  caseData: CaseSchemaV01;
  saveData: CaseSaveV01;
  selectedCharacterId: string | null;
  onSelectCharacter: (characterId: string) => void;
  onMoveNode: (characterId: string, nodeId: string) => void;
  onGrantClues: (clueIds: string[]) => void;
  onEvidenceSuccess: () => void;
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
  playSfx
}: Props) {
  const firstCharacterId = caseData.interrogations[0]?.characterId ?? "";
  const characterId = selectedCharacterId ?? firstCharacterId;
  const [resultMessage, setResultMessage] = useState<string>("");
  const [dragOverChoiceId, setDragOverChoiceId] = useState<string | null>(null);
  const [animState, setAnimState] = useState<"shake" | "flash" | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);

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

  const handleCharacterChange = (newId: string) => {
    onSelectCharacter(newId);
    setResultMessage("");
  };

  useEffect(() => {
    setResultMessage("");
    setDragOverChoiceId(null);
  }, [characterId]);

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
    }, 18); // ~18ms per character
    return () => clearInterval(interval);
  }, [node?.text, node?.nodeId]);

  const triggerAnim = (type: "shake" | "flash") => {
    setAnimState(type);
    setTimeout(() => setAnimState(null), 600);
  };

  const handleDropEvidence = (e: React.DragEvent, choiceId: string) => {
    e.preventDefault();
    setDragOverChoiceId(null);
    const droppedClueId = e.dataTransfer.getData("text/plain");
    if (!droppedClueId) return;

    const applied = InterrogationEngine.applyChoice({
      caseData,
      characterId,
      currentNodeId,
      choiceId,
      presentedClueId: droppedClueId
    });

    if (!applied.ok) {
      setResultMessage(applied.error);
      triggerAnim("flash");
      playSfx("fail");
      return;
    }

    onMoveNode(characterId, applied.nextNodeId);
    if (applied.grantClueIds.length > 0) onGrantClues(applied.grantClueIds);

    if (applied.evidenceSuccess === true) {
      onEvidenceSuccess();
      setResultMessage("증거 제시 성공! 상대가 동요합니다.");
      triggerAnim("shake");
      playSfx("success");
    } else if (applied.evidenceSuccess === false) {
      setResultMessage("엉뚱한 증거입니다. (제시 실패)");
      triggerAnim("flash");
      playSfx("fail");
    } else {
      setResultMessage("");
      playSfx("beep");
    }
  };

  const animClass = animState === "shake" ? "anim-shake" : animState === "flash" ? "anim-flash-red" : "";

  return (
    <section className={`panel ${animClass}`}>
      <h2>심문</h2>

      {/* Character selector — was in App.tsx */}
      <label className="char-select-label">
        심문 대상&nbsp;
        <select value={characterId} onChange={(e) => handleCharacterChange(e.target.value)}>
          {caseData.interrogations.map((i) => (
            <option key={i.characterId} value={i.characterId}>
              {getCharName(i.characterId)}
            </option>
          ))}
        </select>
      </label>

      {!node ? (
        <p className="muted">노드를 찾을 수 없습니다: {currentNodeId}</p>
      ) : (
        <>
          <article className="dialog-box">
            <strong style={{ display: "block", marginBottom: 6, color: "var(--accent)" }}>
              🎙 {getCharName(node.speakerId)}
            </strong>
            <p className={`npc-text${typingDone ? " done" : ""}`}>{displayedText}</p>
          </article>

          {node.choices.length === 0 && (
            <p className="muted">더 이상 선택지가 없습니다.</p>
          )}

          <div className="choices">
            {node.choices.map((choice) => {
              const isEvidenceChoice = Boolean(choice.evidenceCheck);
              if (isEvidenceChoice) {
                // Render as Droppable Target
                const isOver = dragOverChoiceId === choice.choiceId;
                return (
                  <div
                    key={choice.choiceId}
                    className={`droppable-target choice-row ${isOver ? "drag-over" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverChoiceId(choice.choiceId);
                    }}
                    onDragLeave={() => setDragOverChoiceId(null)}
                    onDrop={(e) => handleDropEvidence(e, choice.choiceId)}
                  >
                    <p className="muted" style={{ margin: 0, textAlign: "center", fontStyle: "italic" }}>
                      [인벤토리에서 단서를 끌어다 던지세요]<br />
                      {choice.label}
                    </p>
                  </div>
                );
              }

              // Normal choice
              return (
                <div key={choice.choiceId} className="choice-row">
                  <button
                    type="button"
                    style={{ width: "100%", textAlign: "left" }}
                    onClick={() => {
                      const applied = InterrogationEngine.applyChoice({
                        caseData,
                        characterId,
                        currentNodeId,
                        choiceId: choice.choiceId
                      });

                      if (!applied.ok) {
                        setResultMessage(applied.error);
                        return;
                      }

                      playSfx("beep");
                      onMoveNode(characterId, applied.nextNodeId);
                      if (applied.grantClueIds.length > 0) onGrantClues(applied.grantClueIds);
                      setResultMessage("");
                    }}
                  >
                    {choice.label}
                  </button>
                </div>
              );
            })}
          </div>

          {resultMessage && <p className="banner">{resultMessage}</p>}
        </>
      )}
    </section>
  );
}
