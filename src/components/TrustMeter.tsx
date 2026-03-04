interface Props {
    characterName: string;
    trust: number; // 0-3
    maxTrust?: number;
}

/**
 * Displays a suspect's trust level as ❤️ hearts.
 * 3 = full trust, 0 = locked (suspect won't talk freely).
 */
export function TrustMeter({ characterName, trust, maxTrust = 3 }: Props) {
    const isLocked = trust <= 0;

    return (
        <div className="trust-meter" aria-label={`${characterName} 신뢰도: ${trust}/${maxTrust}`}>
            <span className="trust-label">
                {isLocked ? "🔒" : "🧑‍💼"} {characterName}
            </span>
            <div className="trust-hearts">
                {Array.from({ length: maxTrust }).map((_, i) => (
                    <span
                        key={i}
                        className={`trust-heart ${i < trust ? "trust-heart-full" : "trust-heart-empty"}`}
                        aria-hidden="true"
                    >
                        {i < trust ? "❤️" : "🖤"}
                    </span>
                ))}
                {isLocked && (
                    <span className="trust-locked-label">접근 차단</span>
                )}
            </div>
        </div>
    );
}
