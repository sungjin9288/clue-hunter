import { useEffect, useRef } from "react";
import type { CaseSchemaV01 } from "../engine/caseTypes";

interface Props {
  caseData: CaseSchemaV01;
  clueId: string | null;
  onClose: () => void;
}

export function ClueDetailModal({ caseData, clueId, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!clueId) return;

    const prevFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusCloseButton = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;
      const modalEl = modalRef.current;
      if (!modalEl) return;

      const focusables = Array.from(
        modalEl.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        )
      ).filter((el) => !el.hasAttribute("disabled"));

      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusCloseButton);
      window.removeEventListener("keydown", handleKeyDown);
      prevFocused?.focus();
    };
  }, [clueId, onClose]);

  if (!clueId) return null;

  const clue = caseData.clues.find((c) => c.clueId === clueId);
  if (!clue) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal clue-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clue-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="clue-modal-header">
          <span className="clue-modal-icon">🔬</span>
          <h3 id="clue-modal-title" style={{ margin: "0 0 0 8px", flex: 1 }}>{clue.title}</h3>
        </div>

        {/* Evidence text in typewriter style */}
        <div className="clue-modal-body">
          <p>{clue.text}</p>
        </div>

        {/* Detective's inner monologue (flavor text) */}
        {clue.detectiveFlavor && (
          <blockquote className="detective-flavor">
            <span className="detective-flavor-icon">🕵️</span>
            <em>{clue.detectiveFlavor}</em>
          </blockquote>
        )}

        {/* Tag badges */}
        <div className="clue-tags">
          {clue.tags.time && (
            <span className="clue-tag clue-tag-time">🕐 {clue.tags.time}</span>
          )}
          {clue.tags.location && (
            <span className="clue-tag clue-tag-location">📍 {clue.tags.location}</span>
          )}
          {clue.tags.personId && (
            <span className="clue-tag clue-tag-person">🧑 {clue.tags.personId}</span>
          )}
        </div>

        {/* Source */}
        <p className="muted" style={{ fontSize: "0.75rem", marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 8 }}>
          출처: {clue.source.type} / {clue.source.id}
        </p>

        <button ref={closeButtonRef} type="button" onClick={onClose} style={{ width: "100%", marginTop: 8 }}>
          닫기
        </button>
      </div>
    </div>
  );
}
