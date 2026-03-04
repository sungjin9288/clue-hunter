import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { CaseSchemaV01 } from "../engine/caseTypes";
import type { GradeResult } from "../engine/ReportEngine";

interface Props {
    caseData: CaseSchemaV01;
    gradeResult: GradeResult;
    onBackToMenu: () => void;
    onReset: () => void;
}

export function CaseResultScreen({ caseData, gradeResult, onBackToMenu, onReset }: Props) {
    const [showRank, setShowRank] = useState(false);
    const [showCulprit, setShowCulprit] = useState(false);
    const [showSummary, setShowSummary] = useState(false);

    // Sequential reveal animation
    useEffect(() => {
        const t1 = setTimeout(() => setShowRank(true), 800);
        const t2 = setTimeout(() => setShowCulprit(true), 2500);
        const t3 = setTimeout(() => setShowSummary(true), 4000);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    const isSuccess = gradeResult.passed === gradeResult.total;
    const culpritQ =
        caseData.report.questions.find((q) => q.qId === "q_killer") ??
        caseData.report.questions.find((q) => q.qId === "culprit") ??
        caseData.report.questions[0];
    const culpritName =
        culpritQ?.options.find((o) => o.id === culpritQ.correctOptionId)?.label ??
        caseData.characters.suspects.find((s) => s.id === culpritQ?.correctOptionId)?.name ??
        "알 수 없음";

    return (
        <div className="case-result-screen">
            <div className="result-header">
                <h1 className="result-case-title">{caseData.title}</h1>
                <p className="result-case-subtitle">사건 종결 보고서</p>
            </div>

            {showRank && (
                <div className={`result-rank-box rank-${gradeResult.rank.toLowerCase()}`}>
                    <div className="rank-label">최종 수사 등급</div>
                    <div className="rank-value">{gradeResult.rank}</div>
                    <p className="rank-desc">{gradeResult.rankReason}</p>
                    <div className="score-details muted">
                        추리 정확도: {gradeResult.scorePercent}%
                        {gradeResult.challengeStatus.noHint && " · 힌트 미사용 보너스"}
                    </div>
                </div>
            )}

            {showCulprit && (
                <div className={`result-culprit reveal-fade-in ${isSuccess ? "culprit-success" : "culprit-fail"}`}>
                    <h3>{isSuccess ? "진범 특정 완료" : "수사 미진"}</h3>
                    {isSuccess ? (
                        <p className="culprit-name-banner">{culpritName}</p>
                    ) : (
                        <p className="muted">증거가 불충분하거나 추리가 빗나갔습니다.</p>
                    )}
                </div>
            )}

            {showSummary && (
                <div className="result-summary reveal-fade-up">
                    <h3>사건의 진상</h3>
                    {gradeResult.details.map((d) => {
                        const q = caseData.report.questions.find((x) => x.qId === d.qId);
                        const opt = q?.options.find((o) => o.id === d.selectedOptionId);
                        return (
                            <div key={d.qId} className="result-summary-item">
                                <strong>{q?.prompt}</strong>
                                <p className="muted" style={{ margin: "4px 0 8px" }}>
                                    → 당신의 결론: <span style={{ color: d.pass ? "#88c8ff" : "#ff5a5a" }}>{opt?.label}</span>
                                </p>
                                {opt?.feedbackMd && (
                                    <div className="feedback-box">
                                        <ReactMarkdown>{opt.feedbackMd}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {gradeResult.rank === "S" && caseData.explanations.secretEndingMd && (
                        <div className="secret-ending-box result-secret">
                            <h4>[S랭크 보상] 시크릿 엔딩</h4>
                            <ReactMarkdown>{caseData.explanations.secretEndingMd}</ReactMarkdown>
                        </div>
                    )}

                    <div className="result-actions">
                        <button className="btn-primary btn-large" onClick={onBackToMenu}>
                            사건 종료 (메인 메뉴)
                        </button>
                        <button className="btn-ghost" onClick={onReset}>
                            현재 사건 다시 플레이
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
