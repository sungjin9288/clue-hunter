import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CASE_DIR = path.join(ROOT, "public", "cases");

const TIME_RE = /\b([01]\d|2[0-3]):([0-5]\d)\b/g;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function shiftTimeToken(token, deltaMinutes) {
  const [hh, mm] = token.split(":").map(Number);
  const base = hh * 60 + mm;
  const shifted = (base + deltaMinutes + 24 * 60) % (24 * 60);
  const nh = String(Math.floor(shifted / 60)).padStart(2, "0");
  const nm = String(shifted % 60).padStart(2, "0");
  return `${nh}:${nm}`;
}

function transformString(input, deltaMinutes, nameMap) {
  let out = input.replace(TIME_RE, (token) => shiftTimeToken(token, deltaMinutes));
  for (const [from, to] of Object.entries(nameMap)) {
    out = out.split(from).join(to);
  }
  return out;
}

function deepTransform(value, deltaMinutes, nameMap) {
  if (typeof value === "string") return transformString(value, deltaMinutes, nameMap);
  if (Array.isArray(value)) return value.map((v) => deepTransform(v, deltaMinutes, nameMap));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepTransform(v, deltaMinutes, nameMap);
    }
    return out;
  }
  return value;
}

function applyAltRequiredSets(caseData, setsByQuestion) {
  for (const q of caseData.report.questions ?? []) {
    const nextSets = setsByQuestion[q.qId];
    if (nextSets) {
      q.requiredClueSets = nextSets;
    }
  }
}

const REQUIRED_SETS = {
  case_001: {
    q_killer: [
      ["c_10", "c_11", "c_15"],
      ["c_11", "c_15", "c_16"]
    ],
    q_method: [
      ["c_05", "c_02", "c_12"],
      ["c_02", "c_12", "c_17"]
    ],
    q_motive: [
      ["c_04", "c_06", "c_07"],
      ["c_04", "c_07", "c_21"]
    ]
  },
  case_002: {
    q_killer: [
      ["c_12", "c_18", "c_05"],
      ["c_12", "c_14", "c_18"]
    ],
    q_method: [
      ["c_03", "c_05", "c_17"],
      ["c_03", "c_12", "c_18"]
    ],
    q_motive: [
      ["c_11", "c_13", "c_15"],
      ["c_11", "c_15", "c_18"]
    ]
  },
  case_003_like: {
    q_killer: [
      ["c_17", "c_12", "c_20"],
      ["c_10", "c_12", "c_20"]
    ],
    q_method: [
      ["c_03", "c_05", "c_16"],
      ["c_03", "c_12", "c_19"]
    ],
    q_motive: [
      ["c_11", "c_13", "c_15"],
      ["c_11", "c_13", "c_17"]
    ]
  }
};

const PROFILES = [
  {
    caseId: "case_004",
    title: "[Case 004] Glass Contraband",
    synopsis:
      "세관 보관소에서 밀수 증인이 사라졌다. 유리 파편보다 날카로운 건 시간대별 거짓말이다.",
    estimatedMinutes: 62,
    difficulty: 4,
    deltaMinutes: 7,
    secretEndingMd:
      "깨진 유리 사이에서 남은 것은 발자국이 아니라 서명이다. 다음 건은 더 비싸게 피를 부른다.",
    names: {
      "Han Serin": "Kim Ara",
      "Jun Kyumin": "Baek Sungho",
      "Park Yujin": "Na Yejin",
      "Jang Hojun": "Hwang Taimin",
      "Seo Rina": "Kwon Sori",
      "Choi Namseok": "Im Dongha"
    }
  },
  {
    caseId: "case_005",
    title: "[Case 005] Rainline Betrayal",
    synopsis:
      "우천 운행선에서 정보원이 추락했다. 선로보다 먼저 끊긴 건 내부 신뢰였다.",
    estimatedMinutes: 65,
    difficulty: 4,
    deltaMinutes: 14,
    secretEndingMd:
      "비에 씻겨도 지워지지 않는 건 결제 기록이다. 배신은 항상 장부를 남긴다.",
    names: {
      "Han Serin": "Yoon Nari",
      "Jun Kyumin": "Do Seungjae",
      "Park Yujin": "Shin Mina",
      "Jang Hojun": "Kang Dohyun",
      "Seo Rina": "Jo Haeryeong",
      "Choi Namseok": "Oh Junho"
    }
  },
  {
    caseId: "case_006",
    title: "[Case 006] Blue Ledger",
    synopsis:
      "회계 서버가 멈춘 밤, 내부 고발자는 장부와 함께 입을 닫았다. 숫자가 증언을 대신한다.",
    estimatedMinutes: 68,
    difficulty: 5,
    deltaMinutes: 21,
    secretEndingMd:
      "푸른 장부의 마지막 줄은 공범의 몫이었다. 당신은 숫자로 침묵을 뜯어냈다.",
    names: {
      "Han Serin": "Lee Yeonji",
      "Jun Kyumin": "Song Jaewook",
      "Park Yujin": "Han Minseo",
      "Jang Hojun": "Chae Wonho",
      "Seo Rina": "Lim Hayeon",
      "Choi Namseok": "Bae Hojin"
    }
  },
  {
    caseId: "case_007",
    title: "[Case 007] Silent Dockyard",
    synopsis:
      "무전이 끊긴 부두에서 증언자는 침묵한 채 발견됐다. 남은 건 로깅과 바닷물 냄새뿐이다.",
    estimatedMinutes: 71,
    difficulty: 5,
    deltaMinutes: 28,
    secretEndingMd:
      "정적의 부두에서도 신호는 남는다. 당신은 마지막 패킷을 찾아 연쇄를 이어 붙였다.",
    names: {
      "Han Serin": "Jung Seoyeon",
      "Jun Kyumin": "Roh Jisoo",
      "Park Yujin": "Yoo Dahee",
      "Jang Hojun": "Moon Taeyang",
      "Seo Rina": "Ahn Yuri",
      "Choi Namseok": "Kim Jeonguk"
    }
  },
  {
    caseId: "case_008",
    title: "[Case 008] Last Umbra",
    synopsis:
      "모든 연쇄의 마지막 그림자. 누아르 체인의 끝에서 진범은 스스로를 보호할 시간을 잃는다.",
    estimatedMinutes: 74,
    difficulty: 6,
    deltaMinutes: 35,
    secretEndingMd:
      "마지막 그림자가 사라지자 도시는 잠시 조용해졌다. 다음 장은 당신이 정할 차례다.",
    names: {
      "Han Serin": "Seo Jiyeon",
      "Jun Kyumin": "Koo Taehwan",
      "Park Yujin": "Nam Soyeon",
      "Jang Hojun": "Park Jinhyuk",
      "Seo Rina": "Kim Eunsae",
      "Choi Namseok": "Yun Seunghwan"
    }
  },
  {
    caseId: "case_009",
    title: "[Case 009] Hollow Checkpoint",
    synopsis:
      "검문소의 사각지대에서 보호 대상이 끊겼다. 남은 건 허술한 체크리스트와 정확한 분 단위 로그다.",
    estimatedMinutes: 78,
    difficulty: 6,
    deltaMinutes: 42,
    secretEndingMd:
      "빈 검문소도 무언가를 지킨다. 당신은 누락된 검열선을 복구해 마지막 거래를 끊었다.",
    names: {
      "Han Serin": "Choi Sera",
      "Jun Kyumin": "Min Hwan",
      "Park Yujin": "Kim Bora",
      "Jang Hojun": "Lee Joon",
      "Seo Rina": "Han Sohee",
      "Choi Namseok": "Park Daeho"
    }
  },
  {
    caseId: "case_010",
    title: "[Case 010] Pale Trigger",
    synopsis:
      "신호탄이 올라간 밤, 정보 보호선이 동시에 꺼졌다. 누군가는 정확한 타이밍에 방아쇠를 당겼다.",
    estimatedMinutes: 82,
    difficulty: 6,
    deltaMinutes: 49,
    secretEndingMd:
      "연막 뒤에서 타이머를 쥔 손은 하나였다. 당신이 눌러 앉힌 건 트리거가 아니라 연쇄다.",
    names: {
      "Han Serin": "Baek Sujin",
      "Jun Kyumin": "Ryu Sungmin",
      "Park Yujin": "Shin Ara",
      "Jang Hojun": "Jung Minho",
      "Seo Rina": "Yoon Chaeyeon",
      "Choi Namseok": "Seo Taegun"
    }
  },
  {
    caseId: "case_011",
    title: "[Case 011] Burnt Envelope",
    synopsis:
      "소각 직전의 봉투 하나가 모든 진술을 뒤집었다. 불꽃보다 늦게 도착한 알리바이는 믿을 수 없다.",
    estimatedMinutes: 86,
    difficulty: 6,
    deltaMinutes: 56,
    secretEndingMd:
      "타버린 봉투에도 주소는 남는다. 당신은 마지막 수신인을 밝혀 도미노를 멈췄다.",
    names: {
      "Han Serin": "Lim Jaein",
      "Jun Kyumin": "Oh Minseok",
      "Park Yujin": "Song Hyerin",
      "Jang Hojun": "Kim Hyeon",
      "Seo Rina": "Ahn Seol",
      "Choi Namseok": "Do Jinwoo"
    }
  },
  {
    caseId: "case_012",
    title: "[Case 012] Dead Frequency",
    synopsis:
      "주파수가 죽은 시간대에만 사건이 움직인다. 침묵 구간을 맞춘 자가 생존 기록을 지웠다.",
    estimatedMinutes: 90,
    difficulty: 7,
    deltaMinutes: 63,
    secretEndingMd:
      "끊긴 주파수 사이로 진실이 새어 나왔다. 당신은 소음을 증거로 바꿨다.",
    names: {
      "Han Serin": "Jeon Sumin",
      "Jun Kyumin": "Kang Ujin",
      "Park Yujin": "Na Hyeji",
      "Jang Hojun": "Park Wonseok",
      "Seo Rina": "Lee Jiwon",
      "Choi Namseok": "Yoo Taek"
    }
  },
  {
    caseId: "case_013",
    title: "[Case 013] Redacted Mercy",
    synopsis:
      "삭제된 자비 조항 아래에서 증언자는 마지막 선택을 강요받았다. 편집 흔적이 곧 동기다.",
    estimatedMinutes: 94,
    difficulty: 7,
    deltaMinutes: 70,
    secretEndingMd:
      "지워진 문장 끝마다 누군가의 이익이 달려 있었다. 당신은 검열된 동기를 다시 썼다.",
    names: {
      "Han Serin": "Kim Nari",
      "Jun Kyumin": "Yoon Hyunsoo",
      "Park Yujin": "Han Doyeon",
      "Jang Hojun": "Baek Inho",
      "Seo Rina": "Lim Soyeon",
      "Choi Namseok": "Seo Jungil"
    }
  },
  {
    caseId: "case_014",
    title: "[Case 014] Last Transit",
    synopsis:
      "종점 직전 열차칸에서 보호 대상이 사라졌다. 마지막 환승 기록은 누군가 의도적으로 잘렸다.",
    estimatedMinutes: 98,
    difficulty: 7,
    deltaMinutes: 77,
    secretEndingMd:
      "종점은 도착지가 아니라 분기점이었다. 당신은 마지막 환승에서 공범을 분리했다.",
    names: {
      "Han Serin": "Moon Haejin",
      "Jun Kyumin": "Park Sunwoo",
      "Park Yujin": "Kim Dabin",
      "Jang Hojun": "Roh Kyungmin",
      "Seo Rina": "Jeong Gaeul",
      "Choi Namseok": "Choi Yungyu"
    }
  },
  {
    caseId: "case_015",
    title: "[Case 015] Null Testament",
    synopsis:
      "유언 파일이 비어 있는 밤, 상속선은 피로 갱신됐다. 빈 파일의 생성 시각이 전부를 말한다.",
    estimatedMinutes: 102,
    difficulty: 8,
    deltaMinutes: 84,
    secretEndingMd:
      "비어 있는 유언에도 작성자는 있었다. 당신은 null 위에 남은 서명을 찾아냈다.",
    names: {
      "Han Serin": "Shin Hayoon",
      "Jun Kyumin": "Seo Dowan",
      "Park Yujin": "Kang Yerin",
      "Jang Hojun": "Lee Jaemin",
      "Seo Rina": "Song Hani",
      "Choi Namseok": "Hong Siyoon"
    }
  },
  {
    caseId: "case_016",
    title: "[Case 016] Midnight Doctrine",
    synopsis:
      "연쇄 누아르의 종결편. 자정 규약을 지키는 자만 살아남는다. 규약을 만든 사람이 곧 범인이다.",
    estimatedMinutes: 106,
    difficulty: 8,
    deltaMinutes: 91,
    secretEndingMd:
      "규약은 늘 보호를 가장한 통제였다. 당신은 자정의 교리를 해체하고 연쇄를 끝냈다.",
    names: {
      "Han Serin": "Jang Seoyeon",
      "Jun Kyumin": "Kim Taewoo",
      "Park Yujin": "Hwang Yebin",
      "Jang Hojun": "Choi Seongho",
      "Seo Rina": "Bae Arin",
      "Choi Namseok": "Lim Geonwoo"
    }
  }
];

function updateCoreCases() {
  const case001Path = path.join(CASE_DIR, "case_001.json");
  const case002Path = path.join(CASE_DIR, "case_002.json");
  const case003Path = path.join(CASE_DIR, "case_003.json");

  const case001 = readJson(case001Path);
  applyAltRequiredSets(case001, REQUIRED_SETS.case_001);
  writeJson(case001Path, case001);

  const case002 = readJson(case002Path);
  applyAltRequiredSets(case002, REQUIRED_SETS.case_002);
  writeJson(case002Path, case002);

  const case003 = readJson(case003Path);
  applyAltRequiredSets(case003, REQUIRED_SETS.case_003_like);
  writeJson(case003Path, case003);
}

function generateCasesFromTemplate() {
  const templatePath = path.join(CASE_DIR, "case_003.json");
  const template = readJson(templatePath);

  for (const profile of PROFILES) {
    const clone = deepTransform(template, profile.deltaMinutes, profile.names);

    clone.caseId = profile.caseId;
    clone.title = profile.title;
    clone.synopsis = profile.synopsis;
    clone.meta.estimatedMinutes = profile.estimatedMinutes;
    clone.meta.difficulty = profile.difficulty;
    clone.explanations.secretEndingMd = profile.secretEndingMd;
    clone.explanations.summaryMd = `${profile.title}: 시간대 모순과 은폐 로그를 결합해 진실을 재구성한다.`;
    clone.explanations.fullSolutionMd =
      "현장 흔적, 문서 로그, 심문 확보 단서를 결합해 5개 타임라인 슬롯을 완성하고 보고서 3문항을 통과한다.";

    // Keep option ids stable (s1/s2/s3), but refresh visible labels for this case cast.
    const suspects = clone.characters.suspects;
    for (const question of clone.report.questions ?? []) {
      if (question.qId === "q_killer") {
        question.options = [
          { id: "s1", label: suspects[0]?.name ?? "Suspect 1" },
          { id: "s2", label: suspects[1]?.name ?? "Suspect 2" },
          { id: "s3", label: suspects[2]?.name ?? "Suspect 3" }
        ];
      }
    }

    applyAltRequiredSets(clone, REQUIRED_SETS.case_003_like);

    const outputPath = path.join(CASE_DIR, `${profile.caseId}.json`);
    writeJson(outputPath, clone);
  }
}

updateCoreCases();
generateCasesFromTemplate();

console.log("Extended campaign cases generated and clue-set alternatives applied.");
