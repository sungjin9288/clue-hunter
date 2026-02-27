import ReactMarkdown from "react-markdown";
import type { CaseSchemaV01 } from "../engine/caseTypes";

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
        <ReactMarkdown>{selected.bodyMd}</ReactMarkdown>

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
