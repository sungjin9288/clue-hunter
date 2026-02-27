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

  const candidates = selectedSlotId
    ? obtainedClueIds.filter((id) => TimelineEngine.canPlace(caseData, selectedSlotId, id))
    : [];

  return (
    <section className="panel">
      <h3>타임라인 보드 (5 슬롯)</h3>

      <p className="muted">A) 드래그 배치: 아래 단서를 슬롯으로 드롭</p>
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
                if (!TimelineEngine.canPlace(caseData, slot.slotId, clueId)) {
                  alert("이 슬롯에는 해당 단서를 배치할 수 없습니다.");
                  return;
                }
                onPlace(slot.slotId, clueId);
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
                <button type="button" onClick={() => onClear(slot.slotId)}>
                  비우기
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="muted">B) 슬롯 선택 → 카드 선택</p>
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
            if (!selectedSlotId) return;
            const clueId = e.target.value;
            if (!clueId) return;
            onPlace(selectedSlotId, clueId);
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
    </section>
  );
}
