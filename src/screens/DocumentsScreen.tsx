import ReactMarkdown from "react-markdown";
import type { CaseSchemaV01 } from "../engine/caseTypes";
import { highlightTimesInMarkdown } from "../components/TimeHighlight";
import { InlineHelp } from "../components/InlineHelp";

interface Props {
  caseData: CaseSchemaV01;
  selectedDocId: string;
  readDocIds: string[];
  obtainedClueIds: string[];
  onSelectDoc: (docId: string) => void;
  onReadDoc: (docId: string) => void;
  onClaimDocClues: (docId: string, clueIds: string[]) => void;
}

export function DocumentsScreen({
  caseData,
  selectedDocId,
  readDocIds,
  obtainedClueIds,
  onSelectDoc,
  onReadDoc,
  onClaimDocClues
}: Props) {
  const selected = caseData.documents.find((d) => d.docId === selectedDocId) ?? caseData.documents[0];
  const readSet = new Set(readDocIds);
  const obtainedSet = new Set(obtainedClueIds);

  return (
    <section className="panel docs-layout">
      <h2 style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px", gridColumn: "1 / -1" }}>
        📄 문서 열람
        <InlineHelp text="선택한 문서를 열어 숨겨진 단서를 획득하세요. 날짜, 시간, 인물 관계가 중요합니다." />
      </h2>
      <aside>
        <h3>문서 목록</h3>
        {caseData.documents.map((doc) => (
          <button
            key={doc.docId}
            type="button"
            className={`doc-item ${doc.docId === selected.docId ? "active" : ""}`}
            onClick={() => {
              onSelectDoc(doc.docId);
              onReadDoc(doc.docId);
            }}
          >
            {doc.title}
            {readSet.has(doc.docId) ? " (열람)" : ""}
          </button>
        ))}
      </aside>

      <article>
        <h3>{selected.title}</h3>
        <p className="muted">유형: {selected.type}</p>
        <ReactMarkdown>{highlightTimesInMarkdown(selected.bodyMd)}</ReactMarkdown>

        <button
          type="button"
          disabled={selected.rewardClueIds.every((id) => obtainedSet.has(id))}
          onClick={() => onClaimDocClues(selected.docId, selected.rewardClueIds)}
        >
          단서 획득
        </button>
      </article>
    </section>
  );
}
