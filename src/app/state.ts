import type { CaseSchemaV01 } from "../engine/caseTypes";
import type { CaseSaveV01 } from "../engine/SaveService";

export type TabId = "overview" | "scene" | "docs" | "interrogation" | "board-report";

export interface RuntimeState {
  caseData: CaseSchemaV01 | null;
  saveData: CaseSaveV01 | null;
  activeTab: TabId;
  selectedSceneId: string | null;
  selectedDocId: string | null;
  selectedCharacterId: string | null;
  selectedClueId: string | null;
  loadErrors: string[];
  loadWarnings: string[];
}
