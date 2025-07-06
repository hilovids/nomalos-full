"use client";
import { useEffect, useState } from "react";

export default function MobileBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show banner only on small screens (max-width: 640px)
    const checkMobile = () => setShow(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-yellow-400 text-[#232323] px-4 py-3 text-center text-sm font-semibold shadow-lg sm:hidden">
      Nomalos is currently in beta and not fully mobile-friendly. For the best experience, please visit from a computer.
    </div>
  );
}