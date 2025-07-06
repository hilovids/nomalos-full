'use client';
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full z-40 flex justify-between items-center px-8 py-4 border-t border-[#333] bg-[#181818] shadow-sm">
      <span className="text-sm text-[#60a5fa] font-bold tracking-tight">
        Nomalos {new Date().getFullYear()}
      </span>
      <div className="flex items-center gap-4">
        <Link href="/about" className="text-[#e0e7ef] hover:text-white font-medium transition-colors text-sm">
          About
        </Link>
        <Link href="/rules" className="text-[#e0e7ef] hover:text-white font-medium transition-colors text-sm">
          Rules
        </Link>
        <Link href="/privacy" className="text-[#e0e7ef] hover:text-white font-medium transition-colors text-sm">
          Privacy
        </Link>
        <Link href="/api/docs" className="text-[#e0e7ef] hover:text-white font-medium transition-colors text-sm">
          API
        </Link>
        <a
          href="https://github.com/hilovids"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#e0e7ef] hover:text-white font-medium transition-colors text-sm"
        >
          GitHub
        </a>
        <a href='https://ko-fi.com/Q5Q510CQ3D' target='_blank'>
          <img
            height={36}
            style={{ border: 0, height: 36 }}
            src='https://storage.ko-fi.com/cdn/kofi6.png?v=6'
            alt='Buy Me a Coffee at ko-fi.com'
          />
        </a>
      </div>
    </footer>
  );
}