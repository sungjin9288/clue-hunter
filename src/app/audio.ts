// Shared AudioContext singleton – created on first user gesture to satisfy
// the iOS Safari autoplay policy. Lives outside React so it persists across
// re-renders without a ref and without being re-created on every call.

let _ctx: AudioContext | null = null;

type Tone = "good" | "bad";

function getCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const Ctor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
    if (!Ctor) return null;
    if (!_ctx) _ctx = new Ctor();
    return _ctx;
}

function scheduleBeep(ctx: AudioContext, tone: Tone) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.value = tone === "good" ? 880 : 240;
    gain.gain.value = 0.045;

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    osc.stop(now + 0.12);
}

/** Play a short beep. Safe to call on any user gesture; silent on error. */
export function playBeep(tone: Tone): void {
    const ctx = getCtx();
    if (!ctx) return;

    try {
        if (ctx.state === "suspended") {
            ctx.resume().then(() => scheduleBeep(ctx, tone)).catch(() => { /* ignore */ });
        } else {
            scheduleBeep(ctx, tone);
        }
    } catch {
        // ignore – locked audio context or unsupported browser
    }
}
