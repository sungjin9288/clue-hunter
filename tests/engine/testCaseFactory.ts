import type { CaseSchemaV01 } from "../../src/engine/caseTypes";

export function createTestCase(): CaseSchemaV01 {
  return {
    schemaVersion: "0.1",
    caseId: "test_case",
    title: "Test Case",
    synopsis: "Test synopsis",
    meta: {
      tone: "hardboiled",
      estimatedMinutes: 10,
      difficulty: 1
    },
    characters: {
      victim: {
        id: "victim",
        name: "Victim",
        bio: "Victim bio"
      },
      suspects: [
        {
          id: "s1",
          name: "Suspect One",
          bio: "Suspect bio",
          alibiClaim: "I was elsewhere."
        }
      ],
      witnesses: []
    },
    scenes: [
      {
        sceneId: "scene_1",
        title: "Scene One",
        descriptionMd: "Scene description",
        hotspots: [
          {
            hotspotId: "hs_1",
            label: "Hotspot One",
            descriptionMd: "Hotspot description",
            rewardClueIds: ["c_scene", "c_extra_1"]
          }
        ]
      }
    ],
    documents: [
      {
        docId: "doc_1",
        title: "Document One",
        type: "log",
        bodyMd: "Document body",
        rewardClueIds: ["c_doc", "c_extra_2"]
      }
    ],
    clues: [
      {
        clueId: "c_scene",
        title: "Scene Clue",
        text: "From scene",
        tags: { time: "00:01" },
        source: { type: "scene", id: "hs_1" }
      },
      {
        clueId: "c_doc",
        title: "Document Clue",
        text: "From doc",
        tags: { time: "00:02" },
        source: { type: "doc", id: "doc_1" }
      },
      {
        clueId: "c_inter",
        title: "Interrogation Clue",
        text: "From interrogation",
        tags: { time: "00:03" },
        source: { type: "interrogation", id: "node_success" }
      },
      {
        clueId: "c_extra_1",
        title: "Extra Clue 1",
        text: "Extra",
        tags: { time: "00:04" },
        source: { type: "scene", id: "hs_1" }
      },
      {
        clueId: "c_extra_2",
        title: "Extra Clue 2",
        text: "Extra",
        tags: { time: "00:05" },
        source: { type: "doc", id: "doc_1" }
      }
    ],
    clueConnections: [
      {
        connectionId: "conn_1",
        clueIds: ["c_scene", "c_doc"],
        deductionTitle: "Connected",
        deductionMd: "Deduction",
        revealClueIds: ["c_inter"]
      }
    ],
    interrogations: [
      {
        characterId: "s1",
        startNodeId: "node_start",
        nodes: [
          {
            nodeId: "node_start",
            speakerId: "s1",
            text: "Start",
            choices: [
              {
                choiceId: "ask",
                label: "Ask question",
                nextNodeId: "node_end"
              },
              {
                choiceId: "present",
                label: "Present evidence",
                evidenceCheck: {
                  acceptedClueIds: ["c_doc"],
                  successNodeId: "node_success",
                  failNodeId: "node_fail",
                  grantClueIds: ["c_inter"],
                  reactionText: {
                    success: "That proves it.",
                    fail: "That is wrong."
                  }
                }
              }
            ]
          },
          {
            nodeId: "node_success",
            speakerId: "s1",
            text: "Success node",
            choices: []
          },
          {
            nodeId: "node_fail",
            speakerId: "s1",
            text: "Fail node",
            choices: []
          },
          {
            nodeId: "node_end",
            speakerId: "s1",
            text: "End node",
            choices: []
          }
        ]
      }
    ],
    timeline: {
      slots: [
        {
          slotId: "slot_1",
          label: "Slot 1",
          allowedClueIds: ["c_scene", "c_doc", "c_inter", "c_extra_1", "c_extra_2"],
          hint: { l1: "h1", l2: "h2", l3: "h3" }
        },
        {
          slotId: "slot_2",
          label: "Slot 2",
          allowedClueIds: ["c_scene", "c_doc", "c_inter", "c_extra_1", "c_extra_2"],
          hint: { l1: "h1", l2: "h2", l3: "h3" }
        },
        {
          slotId: "slot_3",
          label: "Slot 3",
          allowedClueIds: ["c_scene", "c_doc", "c_inter", "c_extra_1", "c_extra_2"],
          hint: { l1: "h1", l2: "h2", l3: "h3" }
        },
        {
          slotId: "slot_4",
          label: "Slot 4",
          allowedClueIds: ["c_scene", "c_doc", "c_inter", "c_extra_1", "c_extra_2"],
          hint: { l1: "h1", l2: "h2", l3: "h3" }
        },
        {
          slotId: "slot_5",
          label: "Slot 5",
          allowedClueIds: ["c_scene", "c_doc", "c_inter", "c_extra_1", "c_extra_2"],
          hint: { l1: "h1", l2: "h2", l3: "h3" }
        }
      ],
      solution: [
        { slotId: "slot_1", clueId: "c_scene" },
        { slotId: "slot_2", clueId: "c_doc" },
        { slotId: "slot_3", clueId: "c_inter" },
        { slotId: "slot_4", clueId: "c_extra_1" },
        { slotId: "slot_5", clueId: "c_extra_2" }
      ]
    },
    report: {
      minEvidenceToSubmit: 1,
      questions: [
        {
          qId: "q_killer",
          prompt: "Who did it?",
          options: [
            { id: "s1", label: "Suspect One" }
          ],
          correctOptionId: "s1",
          requiredClueSets: [["c_doc"]],
          hint: { l1: "h1", l2: "h2", l3: "h3" }
        }
      ]
    },
    explanations: {
      summaryMd: "Summary",
      fullSolutionMd: "Full solution"
    },
    hintPolicy: {
      maxUses: 3,
      penaltyPerUse: 5
    }
  };
}
