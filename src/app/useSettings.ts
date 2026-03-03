import { useEffect, useState } from "react";

const FONT_KEY = "noir_mvp_font_size";
const SFX_KEY = "noir_mvp_sfx_on";

export type FontSizeMode = "normal" | "large";

interface UseSettingsReturn {
    fontSizeMode: FontSizeMode;
    setFontSizeMode: (mode: FontSizeMode) => void;
    sfxOn: boolean;
    setSfxOn: (on: boolean) => void;
}

/**
 * Persists font size and SFX toggle preferences to localStorage.
 */
export function useSettings(): UseSettingsReturn {
    const [fontSizeMode, setFontSizeModeState] = useState<FontSizeMode>(() => {
        return localStorage.getItem(FONT_KEY) === "large" ? "large" : "normal";
    });

    const [sfxOn, setSfxOnState] = useState<boolean>(() => {
        return localStorage.getItem(SFX_KEY) !== "off";
    });

    const setFontSizeMode = (mode: FontSizeMode) => {
        localStorage.setItem(FONT_KEY, mode);
        setFontSizeModeState(mode);
    };

    const setSfxOn = (on: boolean) => {
        localStorage.setItem(SFX_KEY, on ? "on" : "off");
        setSfxOnState(on);
    };

    // Sync on mount in case another tab changed prefs (best-effort)
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === FONT_KEY && e.newValue) {
                setFontSizeModeState(e.newValue === "large" ? "large" : "normal");
            }
            if (e.key === SFX_KEY && e.newValue) {
                setSfxOnState(e.newValue !== "off");
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    return { fontSizeMode, setFontSizeMode, sfxOn, setSfxOn };
}
