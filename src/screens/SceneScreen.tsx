import ReactMarkdown from "react-markdown";
import type { CaseSchemaV01 } from "../engine/caseTypes";
import { InlineHelp } from "../components/InlineHelp";

interface Props {
  caseData: CaseSchemaV01;
  selectedSceneId: string;
  obtainedClueIds: string[];
  onSelectScene: (sceneId: string) => void;
  onClaimHotspot: (hotspotId: string, clueIds: string[]) => void;
}

export function SceneScreen({
  caseData,
  selectedSceneId,
  obtainedClueIds,
  onSelectScene,
  onClaimHotspot
}: Props) {
  const scene = caseData.scenes.find((s) => s.sceneId === selectedSceneId) ?? caseData.scenes[0];
  const obtained = new Set(obtainedClueIds);

  return (
    <section className="panel">
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        🔍 현장 탐색
        <InlineHelp text="현장의 특정 요소를 조사해 단서를 찾으세요. 조사가 완료된 곳은 금색 뱃지가 표시됩니다." />
      </h2>
      <div className="tab-row">
        {caseData.scenes.map((s) => (
          <button
            key={s.sceneId}
            type="button"
            className={s.sceneId === scene.sceneId ? "active" : ""}
            onClick={() => onSelectScene(s.sceneId)}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Scene atmosphere — detective's inner voice on entering */}
      {scene.atmosphereMd && (
        <blockquote className="scene-atmosphere">
          <span className="scene-atm-icon">🕵️</span>
          <ReactMarkdown>{scene.atmosphereMd}</ReactMarkdown>
        </blockquote>
      )}

      <ReactMarkdown>{scene.descriptionMd}</ReactMarkdown>

      <div className="hotspot-list">
        {scene.hotspots.map((h) => {
          const already = h.rewardClueIds.every((id) => obtained.has(id));
          return (
            <div className={`hotspot-card${already ? " hotspot-done" : ""}`} key={h.hotspotId}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <strong>{h.label}</strong>
                {already && (
                  <span style={{
                    fontSize: "0.72rem",
                    background: "rgba(245,200,66,0.15)",
                    border: "1px solid rgba(245,200,66,0.5)",
                    color: "var(--gold)",
                    borderRadius: 999,
                    padding: "1px 8px",
                    letterSpacing: "0.04em"
                  }}>
                    ✔ 수집 완료
                  </span>
                )}
              </div>
              <ReactMarkdown>{h.descriptionMd}</ReactMarkdown>
              <button
                type="button"
                disabled={already}
                onClick={() => onClaimHotspot(h.hotspotId, h.rewardClueIds)}
                style={already ? { opacity: 0.45 } : { borderColor: "var(--accent)", color: "var(--accent)" }}
              >
                {already ? "단서 이미 획득" : "🔎 조사하기 (단서 획득)"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
