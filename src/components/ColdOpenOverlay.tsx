import { useEffect } from "react";

interface Slide {
  title: string;
  body: string;
}

interface Props {
  slides: Slide[];
  index: number;
  onNext: () => void;
  onSkip: () => void;
}

export function ColdOpenOverlay({ slides, index, onNext, onSkip }: Props) {
  const current = slides[index] ?? slides[0];
  const isLast = index >= slides.length - 1;

  // Lock body scroll while overlay is visible (iOS Safari safe)
  useEffect(() => {
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
  }, []);

  return (
    // backdrop click → skip (same as the skip button)
    <div className="modal-backdrop" onClick={onSkip}>
      <div
        className="modal cold-open-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="cold-open-index muted">
          {index + 1} / {slides.length}
        </p>
        <h2>{current.title}</h2>
        <p>{current.body}</p>
        <div className="cold-open-actions">
          <button type="button" onClick={onSkip}>
            스킵
          </button>
          <button type="button" onClick={isLast ? onSkip : onNext}>
            {isLast ? "사건 시작" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
