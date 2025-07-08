'use client';
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full z-40 flex flex-col sm:flex-row justify-between items-center px-3 sm:px-8 py-2 sm:py-4 border-t border-[#333] bg-[#181818] shadow-sm gap-2 sm:gap-0">
      <span className="text-xs sm:text-sm text-[#fdca33] font-bold tracking-tight sm:mb-0">
        Nomalos {new Date().getFullYear()}
      </span>
      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4">
        <Link href="/about" className="text-[#e0e7ef] hover:text-white font-medium transition-colors text-xs sm:text-sm">
          About
        </Link>
        <Link href="/rules" className="text-[#e0e7ef] hover:text-white font-medium transition-colors text-xs sm:text-sm">
          Rules
        </Link>
        <Link href="/privacy" className="text-[#e0e7ef] hover:text-white font-medium transition-colors text-xs sm:text-sm">
          Privacy
        </Link>
        <Link href="/api/docs" className="text-[#e0e7ef] hover:text-white font-medium transition-colors text-xs sm:text-sm">
          API
        </Link>
        <a
          href="https://github.com/hilovids"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#e0e7ef] hover:text-white font-medium transition-colors text-xs sm:text-sm"
        >
          GitHub
        </a>
        <a href='https://ko-fi.com/Q5Q510CQ3D' target='_blank' className="flex items-center">
          <img
            height={24}
            style={{ border: 0, height: 24 }}
            src='https://storage.ko-fi.com/cdn/kofi6.png?v=6'
            alt='Buy Me a Coffee at ko-fi.com'
          />
        </a>
      </div>
    </footer>
  );
}