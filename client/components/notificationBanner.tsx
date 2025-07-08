"use client";
import { useEffect, useState } from "react";

export default function NotificationBanner({
  message = "Nomalos is currently in beta and not fully mobile-friendly. For the best experience, please visit from a computer.",
  showOnMobileOnly = false,
  className = "",
}: {
  message?: string;
  showOnMobileOnly?: boolean;
  className?: string;
}) {
  const [show, setShow] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (showOnMobileOnly) {
      // Show banner only on small screens (max-width: 640px)
      const checkMobile = () => setShow(window.innerWidth <= 640);
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, [showOnMobileOnly]);

  // Handle fade out
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setShow(false), 250); // match transition duration
  };

  if (!show) return null;

  return (
    <div
      className={`relative w-full bg-yellow-400 text-[#232323] px-2 py-1 text-center text-xs font-semibold shadow-md border-b border-yellow-300 transition-all duration-250 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      } ${className}`}
      style={{ minHeight: "28px" }}
    >
      <div className="pr-6">{message}</div>
      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#232323] hover:text-black text-lg leading-none px-1"
        aria-label="Close notification"
        onClick={handleClose}
        tabIndex={0}
      >
        ×
      </button>
    </div>
  );
}