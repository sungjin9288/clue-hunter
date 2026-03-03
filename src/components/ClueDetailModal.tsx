import { useEffect } from "react";
import type { CaseSchemaV01 } from "../engine/caseTypes";

interface Props {
  caseData: CaseSchemaV01;
  clueId: string | null;
  onClose: () => void;
}

export function ClueDetailModal({ caseData, clueId, onClose }: Props) {
  // Lock body scroll while modal is open (iOS Safari safe)
  useEffect(() => {
    if (!clueId) return;
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
  }, [clueId]);

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
          태그: {clue.tags.time ?? "-"} | {clue.tags.location ?? "-"} |{" "}
          {clue.tags.personId ?? "-"}
        </p>
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
