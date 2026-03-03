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
}

export function InterrogationScreen({
  caseData,
  saveData,
  selectedCharacterId,
  onSelectCharacter,
  onMoveNode,
  onGrantClues,
  onEvidenceSuccess
}: Props) {
  const firstCharacterId = caseData.interrogations[0]?.characterId ?? "";
  const characterId = selectedCharacterId ?? firstCharacterId;
  const [pickedEvidence, setPickedEvidence] = useState<string>("");
  const [resultMessage, setResultMessage] = useState<string>("");

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
    setPickedEvidence("");
  };

  useEffect(() => {
    setResultMessage("");
    setPickedEvidence("");
  }, [characterId]);

  return (
    <section className="panel">
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
            <strong>{getCharName(node.speakerId)}</strong>
            <p>{node.text}</p>
          </article>

          {node.choices.length === 0 && (
            <p className="muted">더 이상 선택지가 없습니다.</p>
          )}

          <div className="choices">
            {node.choices.map((choice) => {
              const isEvidenceChoice = Boolean(choice.evidenceCheck);
              return (
                <div key={choice.choiceId} className="choice-row">
                  <button
                    type="button"
                    onClick={() => {
                      const applied = InterrogationEngine.applyChoice({
                        caseData,
                        characterId,
                        currentNodeId,
                        choiceId: choice.choiceId,
                        presentedClueId: isEvidenceChoice ? pickedEvidence : undefined
                      });

                      if (!applied.ok) {
                        setResultMessage(applied.error);
                        return;
                      }

                      onMoveNode(characterId, applied.nextNodeId);
                      if (applied.grantClueIds.length > 0) onGrantClues(applied.grantClueIds);

                      if (applied.evidenceSuccess === true) {
                        onEvidenceSuccess();
                        setResultMessage("증거 제시 성공 ✓");
                      } else if (applied.evidenceSuccess === false) {
                        setResultMessage("증거 제시 실패 ✗");
                      } else {
                        setResultMessage("");
                      }
                    }}
                  >
                    {choice.label}
                  </button>

                  {isEvidenceChoice && (
                    <select
                      value={pickedEvidence}
                      onChange={(e) => setPickedEvidence(e.target.value)}
                    >
                      <option value="">제시할 단서 선택</option>
                      {saveData.obtainedClueIds.map((id) => {
                        const clue = caseData.clues.find((c) => c.clueId === id);
                        if (!clue) return null;
                        return (
                          <option key={id} value={id}>
                            {clue.title}
                          </option>
                        );
                      })}
                    </select>
                  )}
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
