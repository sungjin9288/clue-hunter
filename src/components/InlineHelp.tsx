import { useState, useRef, useEffect } from "react";

interface Props {
    text?: string;
    children?: React.ReactNode;
}

export function InlineHelp({ text, children }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when tapping outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("touchstart", handleClick, { passive: true });
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("touchstart", handleClick);
        };
    }, [isOpen]);

    return (
        <div className="inline-help-container" ref={containerRef}>
            <button
                type="button"
                className="inline-help-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                aria-label="도움말 보기"
            >
                ?
            </button>

            {isOpen && (
                <div className="inline-help-popover">
                    {text && <p>{text}</p>}
                    {children}
                </div>
            )}
        </div>
    );
}
