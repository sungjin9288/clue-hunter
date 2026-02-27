import type { CaseSchemaV01 } from "../engine/caseTypes";

interface Props {
  caseData: CaseSchemaV01;
  clueId: string | null;
  onClose: () => void;
}

export function ClueDetailModal({ caseData, clueId, onClose }: Props) {
  if (!clueId) return null;

  const clue = caseData.clues.find((c) => c.clueId === clueId);
  if (!clue) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{clue.title}</h3>
        <p>{clue.text}</p>
        <p className="muted">
          출처: {clue.source.type} / {clue.source.id}
        </p>
        <p className="muted">
          태그: {clue.tags.time ?? "-"} | {clue.tags.location ?? "-"} | {clue.tags.personId ?? "-"}
        </p>
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
