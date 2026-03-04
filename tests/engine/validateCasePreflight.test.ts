import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { CaseSchemaV01 } from "../../src/engine/caseTypes";
import { validateCasePreflight } from "../../src/engine/validateCasePreflight";
import { createTestCase } from "./testCaseFactory";

describe("validateCasePreflight", () => {
  it("passes all bundled case JSON files without preflight errors", () => {
    const casesDir = path.resolve(process.cwd(), "public", "cases");
    const files = fs
      .readdirSync(casesDir)
      .filter((name) => /^case_\d{3}.*\.json$/.test(name))
      .sort();

    expect(files.length).toBeGreaterThan(0);

    for (const fileName of files) {
      const raw = fs.readFileSync(path.join(casesDir, fileName), "utf8");
      const caseData = JSON.parse(raw) as CaseSchemaV01;
      const result = validateCasePreflight(caseData);
      expect(result.errors, `${fileName}: ${result.errors.join(" | ")}`).toEqual([]);
      expect(result.ok, `${fileName} should pass preflight`).toBe(true);
    }
  });

  it("rejects clueConnections.revealClueIds that reference unknown clues", () => {
    const caseData = createTestCase();
    if (!caseData.clueConnections || caseData.clueConnections.length === 0) {
      throw new Error("Test fixture must contain clueConnections");
    }

    caseData.clueConnections[0].revealClueIds = ["missing_clue"];
    const result = validateCasePreflight(caseData);

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((error) =>
        error.includes("clueConnection(conn_1).revealClueIds contains unknown clueId=missing_clue")
      )
    ).toBe(true);
  });
});
