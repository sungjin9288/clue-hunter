import { useCallback, useEffect, useRef, useState } from "react";
import { playBeep } from "./audio";

export type AchievementTone = "good" | "bad";

interface AchievementState {
    label: string;
    tone: AchievementTone;
}

interface UseAchievementReturn {
    achievement: AchievementState | null;
    showAchievement: (label: string, tone: AchievementTone) => void;
}

/**
 * Manages timed achievement toast state.
 * Plays an audio beep via the shared AudioContext if sfxOn is true.
 */
export function useAchievement(sfxOn: boolean): UseAchievementReturn {
    const [achievement, setAchievement] = useState<AchievementState | null>(null);
    const timerRef = useRef<number | null>(null);
    const lastShownRef = useRef<{ label: string; at: number } | null>(null);

    const clearTimer = () => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    // Cleanup on unmount
    useEffect(() => clearTimer, []);

    const showAchievement = useCallback(
        (label: string, tone: AchievementTone) => {
            const now = Date.now();
            const last = lastShownRef.current;
            // Prevent rapid duplicate spam from repeated taps/events.
            if (last && last.label === label && now - last.at < 1200) return;
            lastShownRef.current = { label, at: now };

            setAchievement({ label, tone });
            clearTimer();
            timerRef.current = window.setTimeout(() => {
                setAchievement(null);
                timerRef.current = null;
            }, 1500);

            if (sfxOn) {
                playBeep(tone);
            }
        },
        [sfxOn]
    );

    return { achievement, showAchievement };
}
