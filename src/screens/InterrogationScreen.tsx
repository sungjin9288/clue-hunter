import { useState } from "react";
import type { CaseSchemaV01 } from "../engine/caseTypes";
import { InterrogationEngine } from "../engine/InterrogationEngine";

interface Props {
  caseData: CaseSchemaV01;
  characterId: string;
  currentNodeId: string;
  obtainedClueIds: string[];
  onMoveNode: (characterId: string, nodeId: string) => void;
  onGrantClues: (clueIds: string[]) => void;
}

export function InterrogationScreen({
  caseData,
  characterId,
  currentNodeId,
  obtainedClueIds,
  onMoveNode,
  onGrantClues
}: Props) {
  const [pickedEvidence, setPickedEvidence] = useState<string>("");
  const [resultMessage, setResultMessage] = useState<string>("");

  const node = InterrogationEngine.getNode(caseData, characterId, currentNodeId);
  if (!node) {
    return (
      <section className="panel">
        <h2>심문</h2>
        <p>노드를 찾을 수 없습니다: {currentNodeId}</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>심문</h2>
      <p className="muted">대상: {characterId}</p>

      <article className="dialog-box">
        <strong>{node.speakerId}</strong>
        <p>{node.text}</p>
      </article>

      {node.choices.length === 0 ? <p className="muted">더 이상 선택지가 없습니다.</p> : null}

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
                    setResultMessage("증거 제시 성공");
                  } else if (applied.evidenceSuccess === false) {
                    setResultMessage("증거 제시 실패");
                  } else {
                    setResultMessage("");
                  }
                }}
              >
                {choice.label}
              </button>

              {isEvidenceChoice ? (
                <select value={pickedEvidence} onChange={(e) => setPickedEvidence(e.target.value)}>
                  <option value="">제시할 단서 선택</option>
                  {obtainedClueIds.map((id) => {
                    const clue = caseData.clues.find((c) => c.clueId === id);
                    if (!clue) return null;
                    return (
                      <option key={id} value={id}>
                        {clue.title}
                      </option>
                    );
                  })}
                </select>
              ) : null}
            </div>
          );
        })}
      </div>

      {resultMessage ? <p className="banner">{resultMessage}</p> : null}
    </section>
  );
}
