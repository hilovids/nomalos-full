"use client";
import { useEffect, useState } from "react";

export default function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        function onScroll() {
            setVisible(window.scrollY > window.innerHeight);
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <button
            aria-label="Scroll to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`
        fixed z-50 right-4 bottom-20 sm:bottom-20
        bg-[#60a5fa] text-white rounded-full shadow-lg
        p-3 sm:p-4 transition-opacity duration-300
        ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}
        sm:right-4 sm:bottom-4
        active:scale-95
      `}
            style={{
                fontSize: "1.5rem",
                boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
            }}
        >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 14 12 8 18 14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    );
}