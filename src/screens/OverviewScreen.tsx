import type { CaseSchemaV01 } from "../engine/caseTypes";
import type { CaseSaveV01 } from "../engine/SaveService";

interface Props {
  caseData: CaseSchemaV01;
  saveData: CaseSaveV01;
}

export function OverviewScreen({ caseData, saveData }: Props) {
  const totalClues = caseData.clues.length;
  const gotClues = saveData.obtainedClueIds.length;
  const readDocs = saveData.readDocIds.length;
  const totalDocs = caseData.documents.length;

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
    </section>
  );
}
