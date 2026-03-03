# Noir MVP Dev Memo

## 2026-03-01

### Current Goal
- Expand from short single-case flow into a chained campaign structure that can grow toward long-form playtime.
- Keep existing schema/engine/UI architecture stable (no new runtime systems).

### Ordered Execution Log
- [x] Confirm current baseline (`case_000`~`case_003`, build green).
- [x] Add `case_004`~`case_008` content files.
- [x] Extend campaign further to `case_009`~`case_016` for long-play baseline.
- [x] Wire case catalog and unlock chain up to `case_008`.
- [x] Wire case catalog and unlock chain up to `case_016`.
- [x] Increase report replayability with multi `requiredClueSets` (OR-of-AND) on all core cases.
- [x] Run preflight/build and log risks.
- [x] Add retention-oriented meta progression markers (CLEAR/PERFECT + challenge flags).

### Progress Notes (In-flight)
- Added a reproducible content utility: `scripts/extend_campaign_cases.mjs`.
- Applied OR-based clue set alternatives to `case_001`, `case_002`, `case_003`.
- Generated chained cases `case_004`~`case_008` from validated structure to minimize schema break risk.
- Generated additional chained cases `case_009`~`case_016` with the same stable schema.
- Added challenge persistence in campaign stats:
  - `noHintClear`: clear with hint usage 0
  - `tightEvidenceClear`: clear with exactly min evidence count
- Fixed completion semantics: only full pass (`passed===total`) increments case completion/unlock.
- Added retention feedback loop:
  - Case selector now exposes first-clear timestamp and perfect clear count.
  - Report clear now triggers queued overlays: `CASE CLOSED`, `PERFECT CLEAR`, `NO-HINT CLEAR`, `TIGHT EVIDENCE CLEAR`.
- Added minimal hint-use loop (no new system):
  - Report screen now supports global hint usage (`hintUses`) with cap `hintPolicy.maxUses`.
  - Per-question hint lines (`l1/l2/l3`) reveal by current hint use count.
- Narrative polish batch completed for `case_004`~`case_016`:
  - Rewrote synopsis/character bios/alibi/scene titles+descriptions/hotspot labels/document titles+body/clue text/report method+motive labels/explanation text.
  - Kept schema IDs and engine references untouched.
- Challenge balance tuning completed:
  - `S` rank now requires: full pass + no hint + tight evidence(min exact).
  - Full pass but challenge miss now drops to `A` or `B` with explicit reason text.
  - Report result UI now displays challenge status and rank drop reason.
- Challenge signaling anti-spam patch:
  - Duplicate achievement label within 1.2s is ignored.
  - Prevents repeated `HINT USED` and rapid multi-event overlay spam.

### Validation Snapshot
- Preflight: `case_000`~`case_008` all pass (`case_000` keeps 1 warning by design).
- Build: `npm run build` success.
- Preflight: `case_000`~`case_016` all pass (`case_000` keeps 1 warning by design).
- Build: `npm run build` success after extending case catalog.
- Current estimated content volume: `1241 minutes` (~20.7h) by metadata sum.
- Narrative-polished cases also pass preflight/build with no schema regressions.
- Rank/challenge tuning patch also passes preflight/build with no schema regressions.

### Risk Log
- `case_004`~`case_008` are structurally safe but still template-derived; narrative differentiation should be deepened.
- `case_009`~`case_016` also template-derived and need dedicated writing pass for uniqueness.
- Estimated minutes are content metadata, not measured real session data yet.
- Long-play target (20h) still requires additional loops (higher-rank routes / optional objectives / more case volume).

### Next Ordered Work (Toward 20h)
1. Polish challenge signaling anti-spam (achievement queue dedupe/cooldown).
2. Add cross-case continuity text beats (entity callbacks between cases).
3. Add meta rewards copy per milestone clear count (3/8/16 case clears).

### Direction Notes (Do Not Forget)
- The fastest path to longer playtime is content volume + replay loops, not engine complexity.
- Keep iOS-safe interaction baseline as slot-select UX first, drag second.
- Rank S route should remain meaningful per case (`secretEndingMd` + stricter evidence path).

### Next Develop Candidates (After This Batch)
- Add cross-case continuity hints (same entities appearing with escalating stakes).
- Add "first clear" vs "perfect clear(S)" separation in case list UI.
- Add per-case optional challenge objectives that do not block main clear.
