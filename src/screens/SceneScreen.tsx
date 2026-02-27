import ReactMarkdown from "react-markdown";
import type { CaseSchemaV01 } from "../engine/caseTypes";

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
      <h2>현장 탐색</h2>
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

      <ReactMarkdown>{scene.descriptionMd}</ReactMarkdown>

      <div className="hotspot-list">
        {scene.hotspots.map((h) => {
          const already = h.rewardClueIds.every((id) => obtained.has(id));
          return (
            <div className="hotspot-card" key={h.hotspotId}>
              <strong>{h.label}</strong>
              <ReactMarkdown>{h.descriptionMd}</ReactMarkdown>
              <button
                type="button"
                disabled={already}
                onClick={() => onClaimHotspot(h.hotspotId, h.rewardClueIds)}
              >
                {already ? "획득 완료" : "조사하기(단서 획득)"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
