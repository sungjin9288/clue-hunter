import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CASE_DIR = path.join(ROOT, "public", "cases");
const TARGET_IDS = Array.from({ length: 13 }, (_, i) => `case_${String(i + 4).padStart(3, "0")}`);

const THEMES = {
  case_004: {
    codename: "Glass Contraband",
    synopsis:
      "세관 유리창 아래서 밀수 증인이 사라졌다. 파편보다 날카로운 건 분 단위로 어긋난 진술이다.",
    venue: "Customs Depot",
    trigger: "밀수 증언 파일",
    conceal: "통관 로그 위조",
    motive: "압류 물량 재판매 이권",
    secret:
      "유리 파편을 따라가자 마지막 컨테이너가 열렸다. 당신은 거래선을 역으로 봉인했다."
  },
  case_005: {
    codename: "Rainline Betrayal",
    synopsis:
      "우천 운행선에서 정보원이 추락했다. 선로보다 먼저 끊어진 건 내부 신뢰와 통신 기록이다.",
    venue: "Rainline Terminal",
    trigger: "운행선 안전 패치",
    conceal: "관제 열차 로그 편집",
    motive: "노선 통합 계약 수익",
    secret:
      "비가 지워준 줄 알았던 로그가 다시 떠올랐다. 당신은 환승역 공범까지 끌어냈다."
  },
  case_006: {
    codename: "Blue Ledger",
    synopsis:
      "회계 서버가 멈춘 밤 내부고발자는 장부와 함께 침묵했다. 숫자는 거짓말을 오래 숨기지 못한다.",
    venue: "Finance Vault",
    trigger: "비자금 분배 장부",
    conceal: "결산 스냅샷 롤백",
    motive: "정산 손실 회피",
    secret:
      "푸른 장부의 마지막 칸은 공범 몫이었다. 당신은 분배선을 통째로 압수했다."
  },
  case_007: {
    codename: "Silent Dockyard",
    synopsis:
      "무전이 죽은 부두에서 증언자는 침묵한 채 발견됐다. 남은 건 녹슨 컨테이너와 짧은 패킷뿐.",
    venue: "Dockyard Grid",
    trigger: "선적 스케줄 유출",
    conceal: "무전 채널 블라인드 구간",
    motive: "하역 우선권 담합",
    secret:
      "정적의 부두에도 신호는 남는다. 당신은 마지막 패킷으로 연쇄를 절단했다."
  },
  case_008: {
    codename: "Last Umbra",
    synopsis:
      "연쇄 사건의 끝자락, 그림자 네트워크가 스스로 흔적을 지운다. 하지만 시간표는 끝내 남는다.",
    venue: "Umbra Archive",
    trigger: "연쇄 지시 문건",
    conceal: "아카이브 접근 권한 재기록",
    motive: "상위 라인 보호",
    secret:
      "그림자가 걷히자 지시 체계가 드러났다. 당신은 중간 라인을 통째로 붕괴시켰다."
  },
  case_009: {
    codename: "Hollow Checkpoint",
    synopsis:
      "빈 검문소에서 보호 대상의 이동선이 끊겼다. 체크리스트는 멀쩡한데 시각만 비어 있다.",
    venue: "Checkpoint Ring",
    trigger: "보호 인원 이송 계획",
    conceal: "검문 시퀀스 공란 삽입",
    motive: "통과 수수료 카르텔",
    secret:
      "비어 있던 체크칸에 누군가의 서명이 찍혔다. 당신은 뇌물 루프를 고정했다."
  },
  case_010: {
    codename: "Pale Trigger",
    synopsis:
      "신호탄이 오르던 밤 보호선이 동시에 꺼졌다. 누군가는 분 단위 타이밍으로 방아쇠를 당겼다.",
    venue: "Signal Bastion",
    trigger: "긴급 경보 프로토콜",
    conceal: "발화 로그 역순 기록",
    motive: "비상조달 계약 독점",
    secret:
      "연막 너머 타이머를 쥔 손은 하나였다. 당신은 트리거 체인을 끊었다."
  },
  case_011: {
    codename: "Burnt Envelope",
    synopsis:
      "소각 직전 봉투 하나가 모든 증언을 뒤집었다. 도착 시각이 늦은 알리바이는 대체로 가짜다.",
    venue: "Incineration Wing",
    trigger: "수신인 봉투 원본",
    conceal: "소각 대기열 순번 조작",
    motive: "송달 책임 회피",
    secret:
      "타버린 봉투에도 주소는 남았다. 당신은 마지막 수신인을 증거로 못박았다."
  },
  case_012: {
    codename: "Dead Frequency",
    synopsis:
      "주파수가 죽는 시간대에만 사건이 움직였다. 침묵 구간을 맞춘 자가 생존 기록을 지웠다.",
    venue: "Frequency Hub",
    trigger: "비인가 채널 리스트",
    conceal: "무선 로그 하이라이트 삭제",
    motive: "관제 승급 심사 방어",
    secret:
      "끊긴 주파수 틈에서 명령 패턴이 잡혔다. 당신은 통제권을 되찾았다."
  },
  case_013: {
    codename: "Redacted Mercy",
    synopsis:
      "삭제된 자비 조항 아래서 증언자는 최종 선택을 강요당했다. 검열 흔적이 곧 동기의 윤곽이다.",
    venue: "Contract Tribunal",
    trigger: "삭제 전 계약 조항",
    conceal: "검열본 교체 배포",
    motive: "면책 조항 악용",
    secret:
      "지워진 문장 끝마다 이익이 매달려 있었다. 당신은 검열된 동기를 복원했다."
  },
  case_014: {
    codename: "Last Transit",
    synopsis:
      "종점 직전 객차에서 보호 대상이 사라졌다. 마지막 환승 기록은 누군가 의도적으로 절단했다.",
    venue: "Transit Junction",
    trigger: "환승 인증 토큰",
    conceal: "승차권 로그 분리 저장",
    motive: "노선 재편 이익 선점",
    secret:
      "종점은 도착지가 아니라 분기점이었다. 당신은 환승 공범선을 분해했다."
  },
  case_015: {
    codename: "Null Testament",
    synopsis:
      "유언 파일이 비어 있는 밤 상속선은 피로 갱신됐다. null 파일의 생성 시각이 전부를 말한다.",
    venue: "Probate Core",
    trigger: "유언 원본 해시",
    conceal: "파일 무결성 재서명",
    motive: "상속 배분 독점",
    secret:
      "비어 있던 유언 파일 뒤에 재서명 흔적이 남아 있었다. 당신은 상속선을 되돌렸다."
  },
  case_016: {
    codename: "Midnight Doctrine",
    synopsis:
      "자정 규약을 따르는 조직의 종결편. 규약을 만든 사람이 가장 먼저 규약을 위반했다.",
    venue: "Doctrine Citadel",
    trigger: "규약 원문 키",
    conceal: "규약 버전 역주입",
    motive: "최상위 통제권 사유화",
    secret:
      "교리는 보호가 아니라 통제였다. 당신은 자정의 질서를 해체하고 연쇄를 끝냈다."
  }
};

const timeRe = /\b([01]\d|2[0-3]):([0-5]\d)\b/;

function readCase(caseId) {
  return JSON.parse(fs.readFileSync(path.join(CASE_DIR, `${caseId}.json`), "utf8"));
}

function writeCase(caseId, data) {
  fs.writeFileSync(path.join(CASE_DIR, `${caseId}.json`), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function withTime(text, time) {
  return time ? `${text} 시각 표기 **${time}**.` : text;
}

function pickTime(base, idx) {
  return base[idx % base.length] ?? "";
}

function polishCase(caseData, theme) {
  const timelineTimes = (caseData.timeline?.slots ?? []).map((slot) => slot.label);

  caseData.synopsis = theme.synopsis;
  caseData.explanations.summaryMd = `${theme.codename}: ${theme.trigger} 관련 거짓 진술과 ${theme.conceal} 정황을 시간축으로 고정한다.`;
  caseData.explanations.fullSolutionMd =
    `${timelineTimes.join(" -> ")} 흐름에서 현장/문서/심문 단서를 교차 대조하면 핵심 용의자의 조작 목적(${theme.motive})이 드러난다.`;
  caseData.explanations.secretEndingMd = theme.secret;

  const victim = caseData.characters.victim;
  victim.bio = `${theme.venue} 내부 비리 자료를 넘기려던 보호 증언자. ${theme.trigger}의 마지막 보관자였다.`;
  if (victim.lockedBio?.[0]) {
    victim.lockedBio[0].text = `피해자는 사건 직전 ${theme.trigger} 백업 키를 따로 남겼다.`;
  }

  const suspects = caseData.characters.suspects ?? [];
  if (suspects[0]) {
    suspects[0].bio = `${theme.venue} 접근권한을 가진 운영 책임자. 기록 절차를 누구보다 잘 안다.`;
    suspects[0].alibiClaim = `${pickTime(timelineTimes, 1)}에는 내부 점검 루틴을 수행 중이었다.`;
    if (suspects[0].lockedBio?.[0]) {
      suspects[0].lockedBio[0].text = `${theme.motive} 과정에서 손실이 가장 큰 인물이다.`;
    }
  }
  if (suspects[1]) {
    suspects[1].bio = `${theme.venue} 보안 로그를 관리하는 관제 담당. 복구 권한을 갖고 있다.`;
    suspects[1].alibiClaim = `${pickTime(timelineTimes, 3)}엔 관제 콘솔에서 장애 대응만 했다.`;
    if (suspects[1].lockedBio?.[0]) {
      suspects[1].lockedBio[0].text = `${pickTime(timelineTimes, 3)} 로그를 사후 복원한 흔적이 남아 있다.`;
    }
  }
  if (suspects[2]) {
    suspects[2].bio = `${theme.venue} 설비 정비 담당. 자동 큐와 스케줄 주입 권한이 있다.`;
    suspects[2].alibiClaim = `${pickTime(timelineTimes, 4)} 자동 처리 구간이라 현장 개입이 없었다.`;
    if (suspects[2].lockedBio?.[0]) {
      suspects[2].lockedBio[0].text = `${theme.conceal}에 필요한 기술 작업을 수행할 수 있었다.`;
    }
  }

  const witnesses = caseData.characters.witnesses ?? [];
  if (witnesses[0]) {
    witnesses[0].bio = `${theme.venue} 주변 동선을 본 유일한 목격자. 핵심 구간 진술이 흔들린다.`;
    if (witnesses[0].lockedBio?.[0]) {
      witnesses[0].lockedBio[0].text = `${pickTime(timelineTimes, 4)} 직전, 누군가 ${theme.trigger} 봉투를 전달하는 장면을 봤다.`;
    }
  }
  if (witnesses[1]) {
    witnesses[1].bio = `${theme.venue} 야간 접수 기록 담당. 외부 반입/반출 시각을 관리한다.`;
  }

  const sceneTitles = [
    `${theme.venue} Perimeter`,
    `${theme.venue} Records Bay`,
    `${theme.venue} Control Office`,
    `${theme.venue} Mechanic Deck`
  ];
  const sceneDescriptions = [
    `${theme.venue} 외곽. 야간 조명 아래 동선 흔적이 선명하다.`,
    `${theme.trigger} 관련 기록이 보관된 구역. 접근 흔적이 비정상적으로 겹친다.`,
    `${theme.conceal}에 필요한 콘솔이 모인 공간. 의도적인 누락이 보인다.`,
    `자동 처리 장비가 밀집한 구역. ${theme.motive}와 직접 연결된 조작 흔적이 남아 있다.`
  ];

  const hotspotLabels = [
    "봉인 파열 흔적",
    "이동 궤적 자국",
    "잠금 키패드 누적 입력",
    "찢긴 전달 봉투",
    "약물/장비 사용 흔적",
    "이중 서명 장부",
    "긴급 정지 우회 로그",
    "프레임 누락 구간"
  ];

  const hotspotNarratives = [
    `${theme.trigger} 보관 구역 봉인이 안쪽에서 파열됐다.`,
    `${theme.venue} 내부 이동선이 공식 동선과 어긋난다.`,
    `짧은 시간 내 잠금 시도가 반복됐다.`,
    `${theme.trigger} 전달 봉투의 수취인 칸이 의도적으로 제거됐다.`,
    `${theme.conceal} 직전 사용된 소모품 흔적이 남아 있다.`,
    `동일 항목에 서로 다른 결재 흐름이 겹쳐 있다.`,
    `사건 시각 직전 안전장치가 잠시 비활성화됐다.`,
    `연속 프레임이 비어 있어 개입 시점을 숨긴다.`
  ];

  let hsCursor = 0;
  for (let i = 0; i < (caseData.scenes ?? []).length; i += 1) {
    const scene = caseData.scenes[i];
    scene.title = sceneTitles[i] ?? scene.title;
    scene.descriptionMd = sceneDescriptions[i] ?? scene.descriptionMd;
    for (const hotspot of scene.hotspots ?? []) {
      const originalTime = hotspot.descriptionMd.match(timeRe)?.[0] ?? pickTime(timelineTimes, hsCursor);
      hotspot.label = hotspotLabels[hsCursor] ?? hotspot.label;
      hotspot.descriptionMd = withTime(hotspotNarratives[hsCursor] ?? hotspot.descriptionMd, originalTime);
      hsCursor += 1;
    }
  }

  const docTitles = [
    `${theme.venue} Entry Audit`,
    `${theme.venue} Lock Attempt Log`,
    `${theme.venue} Motive Ledger`,
    `${theme.venue} Controlled Item Log`,
    `${theme.venue} Trigger Amendment`,
    `${theme.venue} Recovery Timeline`,
    `${theme.venue} Threat Memo`,
    `${theme.venue} Auto Queue Trace`
  ];
  const docBodies = [
    `${theme.venue} 출입 센서가 초기 진입 시각을 고정한다.`,
    `잠금 시도 로그가 알리바이와 충돌한다.`,
    `${theme.motive} 관련 금전 흐름이 용의자 이해관계와 맞물린다.`,
    `${theme.conceal} 직전 사용된 통제 품목의 승인 기록.`,
    `${theme.trigger} 수정안이 사건 직전에 재배포됐다.`,
    `누락 프레임 복구 시각이 사건 흐름과 역행한다.`,
    `${theme.trigger}을 압박하는 협박 메모가 남아 있다.`,
    `자동 큐 입력이 시스템 기본 루틴이 아닌 수동 주입으로 확인된다.`
  ];

  for (let i = 0; i < (caseData.documents ?? []).length; i += 1) {
    const doc = caseData.documents[i];
    const time = doc.bodyMd.match(timeRe)?.[0] ?? pickTime(timelineTimes, i);
    doc.title = docTitles[i] ?? doc.title;
    doc.bodyMd = withTime(docBodies[i] ?? doc.bodyMd, time);
  }

  const hotspotToScene = new Map();
  for (const scene of caseData.scenes ?? []) {
    for (const hotspot of scene.hotspots ?? []) {
      hotspotToScene.set(hotspot.hotspotId, scene.title);
    }
  }

  for (const clue of caseData.clues ?? []) {
    const timeSuffix = clue.tags.time ? ` @${clue.tags.time}` : "";
    const num = clue.clueId.replace("c_", "");
    if (clue.source.type === "scene") {
      clue.title = `${theme.codename} 현장 단서 ${num}${timeSuffix}`;
      clue.text = `${theme.venue} 현장에서 확보된 물증. ${theme.conceal} 정황과 이어진다.`;
      clue.tags.location = hotspotToScene.get(clue.source.id) ?? clue.tags.location;
    } else if (clue.source.type === "doc") {
      clue.title = `${theme.codename} 문서 단서 ${num}${timeSuffix}`;
      clue.text = `${theme.trigger} 관련 기록 증거. 진술과 충돌하는 고정 시각을 제공한다.`;
    } else if (clue.source.type === "interrogation") {
      clue.title = `${theme.codename} 심문 단서 ${num}${timeSuffix}`;
      clue.text = `심문 과정에서 확보한 진술 누수. ${theme.motive} 동기를 구체화한다.`;
    }
  }

  for (const q of caseData.report.questions ?? []) {
    if (q.qId === "q_method") {
      q.options = q.options.map((option) => {
        if (option.id === "s1") return { ...option, label: `s1: ${theme.conceal} 기반으로 핵심 증거를 조작` };
        if (option.id === "s2") return { ...option, label: "s2: 관제 혼선만 유발한 단독 교란" };
        if (option.id === "s3") return { ...option, label: "s3: 장비 고장 위장 후 현장 이탈" };
        return option;
      });
    }

    if (q.qId === "q_motive") {
      q.options = q.options.map((option) => {
        if (option.id === "s1") return { ...option, label: `s1: ${theme.motive}` };
        if (option.id === "s2") return { ...option, label: "s2: 평가 하락 및 징계 회피" };
        if (option.id === "s3") return { ...option, label: "s3: 장비 예산 및 외주 계약 확보" };
        return option;
      });
    }
  }
}

for (const caseId of TARGET_IDS) {
  const theme = THEMES[caseId];
  if (!theme) continue;
  const caseData = readCase(caseId);
  polishCase(caseData, theme);
  writeCase(caseId, caseData);
}

console.log(`Narrative polish applied: ${TARGET_IDS.join(", ")}`);
