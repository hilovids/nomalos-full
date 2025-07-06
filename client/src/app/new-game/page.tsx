'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewGamePage() {

  useEffect(() => {
    document.title = "New Game | Nomalos";
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-[#181818] rounded-lg shadow-lg p-8 flex flex-col items-center max-w-md w-full">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          className="mb-4"
          fill="none"
          stroke="#60a5fa" // match logo blue
          strokeWidth="2"
        >
          <path
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h2 className="text-2xl font-bold text-white mb-2 text-center">We're sorry!</h2>
        <p className="text-gray-300 text-center mb-2">
          This page is still under construction.<br />
          Please check back soon.
        </p>
      </div>
    </div>
  );
}