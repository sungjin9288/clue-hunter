import fs from "node:fs";
import path from "node:path";
import { expect, test, type Locator } from "@playwright/test";

interface CaseScene {
  sceneId: string;
  title: string;
}

interface CaseDocument {
  docId: string;
}

interface TimelineSolutionRow {
  slotId: string;
  clueId: string;
}

interface ReportQuestion {
  qId: string;
  correctOptionId: string;
  requiredClueSets: string[][];
}

interface CaseFixture {
  scenes: CaseScene[];
  documents: CaseDocument[];
  timeline: { solution: TimelineSolutionRow[] };
  report: { questions: ReportQuestion[] };
}

const CASE_ID = "case_001";

function loadCaseFixture(caseId: string): CaseFixture {
  const casePath = path.resolve(process.cwd(), "public", "cases", `${caseId}.json`);
  const raw = fs.readFileSync(casePath, "utf8");
  return JSON.parse(raw) as CaseFixture;
}

async function clickIfVisible(locator: Locator, timeout = 6000): Promise<boolean> {
  try {
    await locator.waitFor({ state: "visible", timeout });
    await locator.click();
    return true;
  } catch {
    return false;
  }
}

test("mobile core flow reaches case result screen", async ({ page }) => {
  const caseData = loadCaseFixture(CASE_ID);

  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("noir_mvp_intro_seen_case_000_sandbox", "1");
    localStorage.setItem("noir_tutorial_done", "1");
  });

  await page.goto("/");
  await expect(page.getByTestId("case-selector")).toBeVisible();
  await page.getByTestId("case-selector").selectOption(CASE_ID);

  await clickIfVisible(page.getByRole("button", { name: "스킵" }), 10_000);

  await expect(page.getByTestId("tab-scene")).toBeVisible();
  await expect(page.getByTestId("tab-board-report")).toBeVisible();

  await page.getByTestId("tab-scene").click();
  for (const scene of caseData.scenes) {
    await page.getByRole("button", { name: scene.title }).click();
    const sceneHotspots = page.locator("[data-testid^='scene-hotspot-']");
    const hotspotCount = await sceneHotspots.count();
    for (let i = 0; i < hotspotCount; i += 1) {
      const button = sceneHotspots.nth(i);
      if (await button.isEnabled()) {
        await button.click();
      }
    }
  }

  await page.getByTestId("tab-docs").click();
  for (const doc of caseData.documents) {
    await page.getByTestId(`doc-item-${doc.docId}`).click();
    const claimButton = page.getByTestId("doc-claim-button");
    if (await claimButton.isEnabled()) {
      await claimButton.click();
    }
  }

  await page.getByTestId("tab-board-report").click();

  for (const row of caseData.timeline.solution) {
    const chip = page.getByTestId(`timeline-chip-${row.clueId}`);
    await expect(chip, `Missing timeline clue chip: ${row.clueId}`).toHaveCount(1);
    await chip.scrollIntoViewIfNeeded();
    await chip.click();

    const slot = page.getByTestId(`timeline-slot-${row.slotId}`);
    await slot.scrollIntoViewIfNeeded();
    await slot.click();
  }

  await expect(page.getByText("정답과 일치합니다.")).toBeVisible();

  for (const question of caseData.report.questions) {
    await page
      .getByTestId(`report-answer-${question.qId}-${question.correctOptionId}`)
      .check();
  }

  const evidenceIds = new Set<string>();
  for (const question of caseData.report.questions) {
    for (const clueId of question.requiredClueSets[0] ?? []) {
      evidenceIds.add(clueId);
    }
  }

  await page.locator("[data-testid='report-evidence-panel'] summary").click();
  for (const clueId of evidenceIds) {
    const evidence = page.getByTestId(`report-evidence-${clueId}`);
    await expect(evidence, `Missing evidence checkbox: ${clueId}`).toHaveCount(1);
    await evidence.check();
  }

  await page.getByTestId("report-submit-button").click();

  await expect(page.getByText("사건 종결 보고서")).toBeVisible({ timeout: 12_000 });
  await expect(page.getByText("진범 특정 완료")).toBeVisible({ timeout: 12_000 });
  await expect(page.getByText("사건의 진상")).toBeVisible({ timeout: 15_000 });
});
