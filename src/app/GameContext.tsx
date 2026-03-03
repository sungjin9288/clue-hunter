import { createContext, useContext, type ReactNode } from "react";
import { useGameEngine, type GameEngineValue } from "./useGameEngine";

const GameContext = createContext<GameEngineValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
    const engine = useGameEngine();
    return <GameContext.Provider value={engine}>{children}</GameContext.Provider>;
}

export function useGame(): GameEngineValue {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
    return ctx;
}
