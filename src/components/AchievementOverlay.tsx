interface Props {
  label: string;
  tone?: "good" | "bad";
}

export function AchievementOverlay({ label, tone = "good" }: Props) {
  return (
    <div
      className={`achievement-overlay achievement-${tone} anim-stamp`}
      style={{ pointerEvents: "none" }}
      aria-live="polite"
      aria-atomic="true"
    >
      {label}
    </div>
  );
}
