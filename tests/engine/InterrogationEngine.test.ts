import { describe, expect, it } from "vitest";
import { InterrogationEngine } from "../../src/engine/InterrogationEngine";
import { createTestCase } from "./testCaseFactory";

describe("InterrogationEngine.applyChoice", () => {
  it("moves to next node for non-evidence choices", () => {
    const caseData = createTestCase();
    const result = InterrogationEngine.applyChoice({
      caseData,
      characterId: "s1",
      currentNodeId: "node_start",
      choiceId: "ask"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.nextNodeId).toBe("node_end");
    expect(result.evidenceSuccess).toBeNull();
    expect(result.grantClueIds).toEqual([]);
  });

  it("returns success node and grant clues when evidence is correct", () => {
    const caseData = createTestCase();
    const result = InterrogationEngine.applyChoice({
      caseData,
      characterId: "s1",
      currentNodeId: "node_start",
      choiceId: "present",
      presentedClueId: "c_doc"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.nextNodeId).toBe("node_success");
    expect(result.evidenceSuccess).toBe(true);
    expect(result.grantClueIds).toEqual(["c_inter"]);
  });

  it("routes to fail node without grants when evidence is wrong", () => {
    const caseData = createTestCase();
    const result = InterrogationEngine.applyChoice({
      caseData,
      characterId: "s1",
      currentNodeId: "node_start",
      choiceId: "present",
      presentedClueId: "c_scene"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.nextNodeId).toBe("node_fail");
    expect(result.evidenceSuccess).toBe(false);
    expect(result.grantClueIds).toEqual([]);
  });
});
