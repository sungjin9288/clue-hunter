import { useEffect, useState } from "react";

interface TutorialStep {
    icon: string;
    title: string;
    body: string;
    tab?: string; // bottom-tab id to highlight (optional)
    tip?: string; // pro-tip line
}

const STEPS: TutorialStep[] = [
    {
        icon: "🕵️",
        title: "탐정에 오신 것을 환영합니다",
        body: "당신은 미해결 사건을 담당한 베테랑 탐정입니다. 현장 증거를 모으고, 문서를 분석하고, 용의자를 심문해 범인을 밝혀내세요.",
        tip: "화면 아래 탭을 눌러 각 영역으로 이동합니다."
    },
    {
        icon: "🏚️",
        title: "씬 탐색 — 현장을 뒤져라",
        body: "씬(현장) 탭에서 빛나는 핫스팟을 탭하면 단서를 발견합니다. 금색 뱃지가 표시된 핫스팟은 이미 조사 완료된 곳입니다.",
        tab: "scene",
        tip: "단서는 화면 하단 인벤토리에 저장됩니다."
    },
    {
        icon: "📄",
        title: "문서 분석 — 기록이 진실을 말한다",
        body: "문서 탭에서 CCTV 로그, 채팅 기록, 이메일 등을 읽으면 숨겨진 단서가 드러납니다.",
        tab: "docs",
        tip: "문서를 여는 것만으로도 단서가 자동 수집됩니다."
    },
    {
        icon: "🎙️",
        title: "심문 — 거짓말쟁이를 찾아라",
        body: "심문 탭에서 용의자에게 질문하거나, 단서를 드래그해서 대화 카드에 제시하세요. 잘못된 증거를 너무 많이 제시하면 신뢰(❤️)를 잃습니다.",
        tab: "interrogation",
        tip: "인벤토리에서 단서를 대화 카드로 드래그하세요."
    },
    {
        icon: "📋",
        title: "보드 & 보고서 — 사건을 종결하라",
        body: "보드 탭에서 타임라인 슬롯에 단서를 배치하고, '단서 연결'로 가설을 도출하세요. 준비가 됐으면 보고서를 제출해 범인을 지목하세요!",
        tab: "board-report",
        tip: "핵심 단서를 근거로 첨부하면 더 높은 등급을 받습니다."
    }
];

interface Props {
    onDone: () => void;
}

export function TutorialOverlay({ onDone }: Props) {
    const [step, setStep] = useState(0);
    const current = STEPS[step];
    const isLast = step >= STEPS.length - 1;

    // Lock body scroll
    useEffect(() => {
        const { body } = document;
        const scrollY = window.scrollY;
        const prev = {
            overflow: body.style.overflow,
            position: body.style.position,
            top: body.style.top,
            width: body.style.width
        };
        body.style.overflow = "hidden";
        body.style.position = "fixed";
        body.style.top = `-${scrollY}px`;
        body.style.width = "100%";
        return () => {
            Object.assign(body.style, prev);
            window.scrollTo(0, scrollY);
        };
    }, []);

    // Highlight the relevant tab button
    useEffect(() => {
        // Remove all previous highlights
        document.querySelectorAll(".bottom-tabs button").forEach((el) => {
            el.classList.remove("tutorial-highlight");
        });
        if (current.tab) {
            // Find the button whose onClick sets that tab
            const buttons = Array.from(document.querySelectorAll(".bottom-tabs button"));
            const btn = buttons[["overview", "scene", "docs", "interrogation", "board-report"].indexOf(current.tab)];
            btn?.classList.add("tutorial-highlight");
        }
        return () => {
            document.querySelectorAll(".bottom-tabs button").forEach((el) => {
                el.classList.remove("tutorial-highlight");
            });
        };
    }, [step, current.tab]);

    return (
        <div className="modal-backdrop tutorial-backdrop">
            <div className="modal tutorial-modal" onClick={(e) => e.stopPropagation()}>
                {/* Progress dots */}
                <div className="tutorial-dots">
                    {STEPS.map((_, i) => (
                        <span
                            key={i}
                            className={`tutorial-dot${i === step ? " tutorial-dot-active" : i < step ? " tutorial-dot-done" : ""}`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="tutorial-icon">{current.icon}</div>
                <h2 className="tutorial-title">{current.title}</h2>
                <p className="tutorial-body">{current.body}</p>
                {current.tip && (
                    <p className="tutorial-tip">💡 {current.tip}</p>
                )}

                {/* Actions */}
                <div className="tutorial-actions">
                    <button type="button" className="btn-ghost" onClick={onDone}>
                        건너뛰기
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}
                    >
                        {isLast ? "🕵️ 수사 시작!" : "다음 →"}
                    </button>
                </div>

                <p className="tutorial-counter muted">{step + 1} / {STEPS.length}</p>
            </div>
        </div>
    );
}
