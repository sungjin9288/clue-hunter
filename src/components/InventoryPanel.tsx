import { useMemo } from "react";
import type { CaseSchemaV01 } from "../engine/caseTypes";

interface Props {
  caseData: CaseSchemaV01;
  obtainedClueIds: string[];
  reportEvidenceClueIds: string[];
  onSelectClue: (clueId: string) => void;
  onToggleEvidence?: (clueId: string) => void;
}

export function InventoryPanel(props: Props) {
  const clueMap = useMemo(
    () => new Map(props.caseData.clues.map((c) => [c.clueId, c])),
    [props.caseData]
  );

  return (
    <section className="panel">
      <h3>단서 인벤토리 ({props.obtainedClueIds.length})</h3>
      {props.obtainedClueIds.length === 0 && (
        <p className="muted">아직 획득한 단서가 없습니다.</p>
      )}

      <div className="clue-list">
        {props.obtainedClueIds.map((clueId) => {
          const clue = clueMap.get(clueId);
          if (!clue) return null;

          const attached = props.reportEvidenceClueIds.includes(clueId);
          return (
            <div
              className="clue-card draggable-item"
              key={clueId}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", clueId);
                e.dataTransfer.effectAllowed = "copy";
              }}
            >
              <button
                type="button"
                className="link-btn"
                onClick={() => props.onSelectClue(clueId)}
              >
                <strong>{clue.title}</strong>
                <small>
                  {clue.source.type}:{clue.source.id}
                  {clue.tags.time ? ` · ${clue.tags.time}` : ""}
                </small>
              </button>
              {props.onToggleEvidence && (
                <label className="inline-check">
                  <input
                    type="checkbox"
                    checked={attached}
                    onChange={() => props.onToggleEvidence?.(clueId)}
                  />
                  보고서 근거 첨부
                </label>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
