import { useMemo, useState } from "react";
import type { CaseSchemaV01 } from "../engine/caseTypes";
import { TimelineEngine } from "../engine/TimelineEngine";

interface Props {
  caseData: CaseSchemaV01;
  obtainedClueIds: string[];
  placement: Record<string, string | null>;
  onPlace: (slotId: string, clueId: string) => void;
  onClear: (slotId: string) => void;
}

export function TimelineBoard({ caseData, obtainedClueIds, placement, onPlace, onClear }: Props) {
  const clueMap = useMemo(() => new Map(caseData.clues.map((c) => [c.clueId, c])), [caseData]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string>("");
  const isLikelyIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document));

  const candidates = selectedSlotId ? obtainedClueIds : [];

  const handleDrop = (slotId: string, clueId: string) => {
    if (!TimelineEngine.canPlace(caseData, slotId, clueId)) {
      setDropError("이 슬롯에는 해당 단서를 배치할 수 없습니다.");
      setTimeout(() => setDropError(""), 2500);
      return;
    }
    setDropError("");
    onPlace(slotId, clueId);
  };

  return (
    <section className="panel">
      <h3>타임라인 보드 (5 슬롯)</h3>

      <p className="muted">
        B) 슬롯 선택 → 카드 선택
        {isLikelyIOS ? " (iOS Safari 기본 권장 방식)" : ""}
      </p>
      <div className="selector-row">
        <select
          value={selectedSlotId ?? ""}
          onChange={(e) => setSelectedSlotId(e.target.value || null)}
        >
          <option value="">슬롯 선택</option>
          {caseData.timeline.slots.map((slot) => (
            <option key={slot.slotId} value={slot.slotId}>
              {slot.label} ({slot.slotId})
            </option>
          ))}
        </select>

        <select
          value=""
          onChange={(e) => {
            if (!selectedSlotId || !e.target.value) return;
            handleDrop(selectedSlotId, e.target.value);
          }}
          disabled={!selectedSlotId}
        >
          <option value="">카드 선택</option>
          {candidates.map((clueId) => {
            const clue = clueMap.get(clueId);
            if (!clue) return null;
            return (
              <option key={clueId} value={clueId}>
                {clue.title}
              </option>
            );
          })}
        </select>
      </div>

      <details className="drag-details">
        <summary>A) 드래그 배치</summary>
        <div className="drag-pool">
          {obtainedClueIds.map((clueId) => {
            const clue = clueMap.get(clueId);
            if (!clue) return null;
            return (
              <div
                key={clueId}
                className="drag-chip"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", clueId)}
              >
                {clue.title}
              </div>
            );
          })}
        </div>
      </details>

      {dropError && <p className="banner" style={{ color: "var(--danger)" }}>{dropError}</p>}

      <div className="slot-grid">
        {caseData.timeline.slots.map((slot) => {
          const currentId = placement[slot.slotId];
          const current = currentId ? clueMap.get(currentId) : null;

          return (
            <div
              key={slot.slotId}
              className={`slot ${selectedSlotId === slot.slotId ? "slot-active" : ""}`}
              onClick={() => setSelectedSlotId(slot.slotId)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const clueId = e.dataTransfer.getData("text/plain");
                if (!clueId) return;
                handleDrop(slot.slotId, clueId);
              }}
            >
              <header>
                <strong>{slot.label}</strong>
                <small>{slot.slotId}</small>
              </header>

              <div className="slot-body">
                {current ? current.title : <span className="muted">비어 있음</span>}
              </div>

              <div className="slot-actions">
                <button type="button" onClick={(e) => { e.stopPropagation(); onClear(slot.slotId); }}>
                  비우기
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
