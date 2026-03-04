import { useEffect, useState } from "react";

const FONT_KEY = "noir_mvp_font_size";
const SFX_KEY = "noir_mvp_sfx_on";
const UI_PRESET_KEY = "noir_mvp_ui_preset";
const REST_REMINDER_KEY = "noir_mvp_rest_reminder_minutes";

export type FontSizeMode = "normal" | "large";
export type UiPreset = "standard" | "long-play";

const REST_REMINDER_OPTIONS = [0, 30, 45, 60] as const;
type RestReminderMinutes = (typeof REST_REMINDER_OPTIONS)[number];

interface UseSettingsReturn {
    fontSizeMode: FontSizeMode;
    setFontSizeMode: (mode: FontSizeMode) => void;
    sfxOn: boolean;
    setSfxOn: (on: boolean) => void;
    uiPreset: UiPreset;
    setUiPreset: (preset: UiPreset) => void;
    restReminderMinutes: RestReminderMinutes;
    setRestReminderMinutes: (minutes: RestReminderMinutes) => void;
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

    const [uiPreset, setUiPresetState] = useState<UiPreset>(() => {
        return localStorage.getItem(UI_PRESET_KEY) === "long-play" ? "long-play" : "standard";
    });

    const [restReminderMinutes, setRestReminderMinutesState] = useState<RestReminderMinutes>(() => {
        const raw = Number(localStorage.getItem(REST_REMINDER_KEY));
        return REST_REMINDER_OPTIONS.includes(raw as RestReminderMinutes)
            ? (raw as RestReminderMinutes)
            : 45;
    });

    const setFontSizeMode = (mode: FontSizeMode) => {
        localStorage.setItem(FONT_KEY, mode);
        setFontSizeModeState(mode);
    };

    const setSfxOn = (on: boolean) => {
        localStorage.setItem(SFX_KEY, on ? "on" : "off");
        setSfxOnState(on);
    };

    const setUiPreset = (preset: UiPreset) => {
        localStorage.setItem(UI_PRESET_KEY, preset);
        setUiPresetState(preset);
    };

    const setRestReminderMinutes = (minutes: RestReminderMinutes) => {
        localStorage.setItem(REST_REMINDER_KEY, String(minutes));
        setRestReminderMinutesState(minutes);
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
            if (e.key === UI_PRESET_KEY && e.newValue) {
                setUiPresetState(e.newValue === "long-play" ? "long-play" : "standard");
            }
            if (e.key === REST_REMINDER_KEY && e.newValue) {
                const raw = Number(e.newValue);
                if (REST_REMINDER_OPTIONS.includes(raw as RestReminderMinutes)) {
                    setRestReminderMinutesState(raw as RestReminderMinutes);
                }
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    return {
        fontSizeMode,
        setFontSizeMode,
        sfxOn,
        setSfxOn,
        uiPreset,
        setUiPreset,
        restReminderMinutes,
        setRestReminderMinutes
    };
}
