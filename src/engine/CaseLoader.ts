import type { CaseSchemaV01 } from "./caseTypes";
import { validateCasePreflight } from "./validateCasePreflight";

export type CaseLoadResult =
  | { ok: true; data: CaseSchemaV01; warnings: string[] }
  | { ok: false; errors: string[] };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

export function isCaseSchemaV01(v: unknown): v is CaseSchemaV01 {
  if (!isRecord(v)) return false;

  const requiredTopLevel = [
    "schemaVersion",
    "caseId",
    "title",
    "synopsis",
    "meta",
    "characters",
    "scenes",
    "documents",
    "clues",
    "interrogations",
    "timeline",
    "report",
    "explanations",
    "hintPolicy"
  ];

  if (v.schemaVersion !== "0.1") return false;
  return requiredTopLevel.every((key) => key in v);
}

export async function loadCaseById(caseId: string): Promise<CaseLoadResult> {
  try {
    const res = await fetch(`/cases/${caseId}.json`, { cache: "no-store" });
    if (!res.ok) {
      return { ok: false, errors: [`Case file not found: ${caseId}.json`] };
    }

    const raw: unknown = await res.json();
    if (!isCaseSchemaV01(raw)) {
      return { ok: false, errors: [`Invalid schema: ${caseId}.json is not schemaVersion 0.1`] };
    }

    const preflight = validateCasePreflight(raw);
    if (!preflight.ok) {
      return { ok: false, errors: preflight.errors };
    }

    return { ok: true, data: raw, warnings: preflight.warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, errors: [`Load failed: ${message}`] };
  }
}
