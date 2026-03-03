import type { CaseSchemaV01 } from "../engine/caseTypes";
import type { CampaignProgressV01, CaseSaveV01 } from "../engine/SaveService";

interface Props {
  caseData: CaseSchemaV01;
  saveData: CaseSaveV01;
  campaignProgress: CampaignProgressV01;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function OverviewScreen({ caseData, saveData, campaignProgress }: Props) {
  const totalClues = caseData.clues.length;
  const gotClues = saveData.obtainedClueIds.length;
  const readDocs = saveData.readDocIds.length;
  const totalDocs = caseData.documents.length;
  const caseStats = campaignProgress.cases[caseData.caseId];
  const campaignTargetSeconds = 20 * 60 * 60;
  const campaignProgressPct = Math.min(
    100,
    Math.round((campaignProgress.totalPlaySeconds / campaignTargetSeconds) * 100)
  );
  const noHintDone = caseStats?.challengeFlags?.noHintClear ?? false;
  const tightDone = caseStats?.challengeFlags?.tightEvidenceClear ?? false;

  return (
    <section className="panel">
      <h2>{caseData.title}</h2>
      <p>{caseData.synopsis}</p>

      <dl className="stats-grid">
        <div>
          <dt>톤</dt>
          <dd>{caseData.meta.tone}</dd>
        </div>
        <div>
          <dt>예상 플레이</dt>
          <dd>{caseData.meta.estimatedMinutes}분</dd>
        </div>
        <div>
          <dt>단서</dt>
          <dd>
            {gotClues} / {totalClues}
          </dd>
        </div>
        <div>
          <dt>문서 열람</dt>
          <dd>
            {readDocs} / {totalDocs}
          </dd>
        </div>
      </dl>

      <p className="muted">마지막 저장: {new Date(saveData.updatedAt).toLocaleString()}</p>

      <div className="panel" style={{ marginTop: "8px" }}>
        <h4 style={{ margin: "0 0 6px 0" }}>캠페인 진행 현황</h4>
        <p className="muted">
          시도 {caseStats?.attempts ?? 0}회 · 완료 {caseStats?.completedCount ?? 0}회 · 최고 랭크{" "}
          {caseStats?.bestRank ?? "-"} · 누적 플레이 {formatDuration(caseStats?.totalPlaySeconds ?? 0)}
        </p>
        <p className="muted">
          전체 누적 플레이: {formatDuration(campaignProgress.totalPlaySeconds)}
        </p>
        <p className="muted">
          장기 목표 진행: {campaignProgressPct}% (20h 기준)
        </p>
        <p className="muted">
          챌린지: {noHintDone ? "No-Hint✓" : "No-Hint✗"} ·{" "}
          {tightDone ? `Tight-Evidence✓` : `Tight-Evidence✗(근거 ${caseData.report.minEvidenceToSubmit}장 정확히)`}
        </p>
      </div>

      <hr />

      <h3>인물 프로파일</h3>
      <div className="profile-list">
        {[caseData.characters.victim, ...caseData.characters.suspects, ...caseData.characters.witnesses].map((char) => {
          const lockedBios = (char as any).lockedBio as { text: string; unlockClueId: string }[] | undefined;

          return (
            <div key={char.id} className="profile-card">
              <h4>{char.name}</h4>
              <p>{char.bio}</p>
              {("alibiClaim" in char) && typeof (char as any).alibiClaim === "string" && (
                <p className="alibi-text"><strong>알리바이 주장:</strong> {(char as any).alibiClaim}</p>
              )}

              {Array.isArray(lockedBios) && lockedBios.length > 0 && (
                <ul className="locked-bios">
                  {lockedBios.map((lb, idx) => {
                    const isUnlocked = saveData.obtainedClueIds.includes(lb.unlockClueId);
                    return (
                      <li key={idx} className={isUnlocked ? "unlocked" : "locked"}>
                        {isUnlocked ? lb.text : "🔒 숨겨진 정보 (단서 획득 시 해금)" as React.ReactNode}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
