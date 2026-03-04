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
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string>("");
  const [pulsedSlot, setPulsedSlot] = useState<string | null>(null);

  const handleDrop = (slotId: string, clueId: string) => {
    setDragOverSlot(null);
    if (!TimelineEngine.canPlace(caseData, slotId, clueId)) {
      setDropError("이 슬롯에는 해당 단서를 배치할 수 없습니다.");
      setTimeout(() => setDropError(""), 2500);
      return;
    }
    setDropError("");
    onPlace(slotId, clueId);
    // trigger pulse
    setPulsedSlot(slotId);
    setTimeout(() => setPulsedSlot(null), 900);
  };

  const filledCount = Object.values(placement).filter(Boolean).length;
  const totalSlots = caseData.timeline.slots.length;
  const allFilled = filledCount === totalSlots;

  return (
    <section className="panel">
      <h3 style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 4px 0" }}>
        <span>📌 타임라인</span>
        <span style={{ fontSize: "0.8rem", color: allFilled ? "var(--success)" : "var(--muted)", fontWeight: "normal" }}>
          {filledCount}/{totalSlots} {allFilled ? "✅ 완성" : ""}
        </span>
      </h3>
      <p className="muted" style={{ margin: "0 0 12px 0", fontSize: "0.8rem" }}>
        하단 단서를 슬롯에 드래그해서 배치하세요
      </p>

      {dropError && <p className="banner" style={{ color: "var(--danger)", marginBottom: 8 }}>{dropError}</p>}

      {/* Slot Grid */}
      <div className="slot-grid">
        {caseData.timeline.slots.map((slot) => {
          const currentId = placement[slot.slotId];
          const current = currentId ? clueMap.get(currentId) : null;
          const isOver = dragOverSlot === slot.slotId;
          const isFilled = Boolean(current);
          const isPulsing = pulsedSlot === slot.slotId;

          return (
            <div
              key={slot.slotId}
              className={[
                "slot",
                isFilled ? "slot-filled" : "",
                isOver ? "droppable-target drag-over" : (isFilled ? "" : "droppable-target"),
                isPulsing ? "slot-pulsing" : ""
              ].filter(Boolean).join(" ")}
              onDragOver={(e) => { e.preventDefault(); setDragOverSlot(slot.slotId); }}
              onDragLeave={() => setDragOverSlot(null)}
              onDrop={(e) => {
                const clueId = e.dataTransfer.getData("text/plain");
                if (!clueId) return;
                handleDrop(slot.slotId, clueId);
              }}
            >
              <header>
                <strong style={{ fontSize: "0.85rem" }}>{slot.label}</strong>
                <small style={{ color: "var(--muted)" }}>{slot.slotId}</small>
              </header>

              <div className="slot-body" style={{ margin: "8px 0", minHeight: 28 }}>
                {current ? (
                  <span style={{ color: "var(--success)", fontWeight: "bold" }}>
                    ✓ {current.title}
                  </span>
                ) : (
                  <span className="muted" style={{ fontSize: "0.8rem", fontStyle: "italic" }}>
                    {isOver ? "놓으세요!" : "비어 있음 · 단서를 여기로 드롭"}
                  </span>
                )}
              </div>

              {isFilled && (
                <div className="slot-actions">
                  <button
                    type="button"
                    style={{ fontSize: "0.72rem", padding: "4px 8px", color: "var(--muted)", borderColor: "var(--line)" }}
                    onClick={(e) => { e.stopPropagation(); onClear(slot.slotId); }}
                  >
                    🗑 제거
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Draggable clue pool at bottom */}
      <div style={{ marginTop: 16 }}>
        <p className="muted" style={{ fontSize: "0.75rem", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          단서 카드 (드래그)
        </p>
        <div className="drag-pool">
          {obtainedClueIds.length === 0 ? (
            <span className="muted" style={{ fontSize: "0.8rem" }}>아직 획득한 단서 없음</span>
          ) : (
            obtainedClueIds.map((clueId) => {
              const clue = clueMap.get(clueId);
              if (!clue) return null;
              const alreadyPlaced = Object.values(placement).includes(clueId);
              return (
                <div
                  key={clueId}
                  className="drag-chip draggable-item"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", clueId);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  style={{
                    opacity: alreadyPlaced ? 0.4 : 1,
                    borderColor: alreadyPlaced ? "var(--muted)" : "var(--accent)",
                    background: alreadyPlaced ? "transparent" : "rgba(245,166,35,0.07)"
                  }}
                >
                  {alreadyPlaced ? "✓ " : ""}{clue.title}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
