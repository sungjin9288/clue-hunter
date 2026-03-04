import { describe, expect, it } from "vitest";
import { ReportEngine } from "../../src/engine/ReportEngine";
import { createTestCase } from "./testCaseFactory";

describe("ReportEngine.grade", () => {
  it("blocks submission when evidence is below minimum", () => {
    const caseData = createTestCase();
    const result = ReportEngine.grade({
      caseData,
      answers: { q_killer: "s1" },
      evidenceClueIds: [],
      hintUses: 0
    });

    expect(result.canSubmit).toBe(false);
    expect(result.passed).toBe(0);
    expect(result.rank).toBe("C");
  });

  it("returns S for full pass with no hints and tight evidence", () => {
    const caseData = createTestCase();
    const result = ReportEngine.grade({
      caseData,
      answers: { q_killer: "s1" },
      evidenceClueIds: ["c_doc"],
      hintUses: 0
    });

    expect(result.canSubmit).toBe(true);
    expect(result.passed).toBe(1);
    expect(result.total).toBe(1);
    expect(result.rank).toBe("S");
    expect(result.challengeStatus.perfectRoute).toBe(true);
  });

  it("drops to B on full pass when hints are used and evidence is over minimum", () => {
    const caseData = createTestCase();
    const result = ReportEngine.grade({
      caseData,
      answers: { q_killer: "s1" },
      evidenceClueIds: ["c_doc", "c_scene"],
      hintUses: 1
    });

    expect(result.canSubmit).toBe(true);
    expect(result.passed).toBe(1);
    expect(result.rank).toBe("B");
    expect(result.rankReason).toBeDefined();
  });
});
