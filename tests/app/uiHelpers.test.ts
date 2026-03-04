import { describe, expect, it } from "vitest";
import { buildExportPayload, formatDuration, getNextActionGuide } from "../../src/app/uiHelpers";

describe("getNextActionGuide", () => {
  const base = {
    cluesCount: 3,
    interrogationSuccessCount: 1,
    timelineFilledCount: 3,
    timelineTotal: 3,
    reportEvidenceCount: 2,
    reportEvidenceMin: 2,
    reportSubmitted: true
  };

  it("recommends collecting clues first", () => {
    expect(getNextActionGuide({ ...base, cluesCount: 2 })).toContain("단서를 3개 이상");
  });

  it("recommends interrogation when no success exists", () => {
    expect(getNextActionGuide({ ...base, interrogationSuccessCount: 0 })).toContain("심문 탭");
  });

  it("recommends filling timeline slots when incomplete", () => {
    expect(getNextActionGuide({ ...base, timelineFilledCount: 1, timelineTotal: 3 })).toContain("타임라인 슬롯");
  });

  it("recommends attaching more evidence when below minimum", () => {
    expect(getNextActionGuide({ ...base, reportEvidenceCount: 1, reportEvidenceMin: 2 })).toContain("최소 2장");
  });

  it("recommends submitting report when ready but not submitted", () => {
    expect(getNextActionGuide({ ...base, reportSubmitted: false })).toContain("보고서를 제출");
  });

  it("returns replay guidance after submission", () => {
    expect(getNextActionGuide(base)).toContain("재도전");
  });
});

describe("formatDuration", () => {
  it("formats non-positive values as 0m", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(-10)).toBe("0m");
  });

  it("formats minutes-only durations", () => {
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(3599)).toBe("59m");
  });

  it("formats hour+minute durations", () => {
    expect(formatDuration(3600)).toBe("1h 0m");
    expect(formatDuration(7260)).toBe("2h 1m");
  });
});

describe("buildExportPayload", () => {
  it("serializes export metadata and save data", () => {
    const exportedAt = new Date("2026-03-04T00:00:00.000Z");
    const payload = buildExportPayload("v1.2.3", "case_001", { clues: ["c1"] }, exportedAt);
    const parsed = JSON.parse(payload) as {
      buildVersion: string;
      exportedAt: string;
      caseId: string;
      saveData: { clues: string[] };
    };

    expect(parsed.buildVersion).toBe("v1.2.3");
    expect(parsed.caseId).toBe("case_001");
    expect(parsed.exportedAt).toBe("2026-03-04T00:00:00.000Z");
    expect(parsed.saveData).toEqual({ clues: ["c1"] });
    expect(payload).toContain("\n  \"buildVersion\": \"v1.2.3\"");
  });
});
