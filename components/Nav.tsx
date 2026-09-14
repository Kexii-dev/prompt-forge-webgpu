'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Accueil' },
  { href: '/prompt-machine', label: 'Studio' },
  { href: '/compare', label: 'Comparer' },
  { href: '/historique', label: 'Historique' },
  { href: '/settings', label: 'Réglages' },
];

const Nav = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[#232830] bg-[#12151a]">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
          <span className="h-2 w-2 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399]" />
          WebGPU Lab
        </Link>
        <nav className="hidden gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                pathname === l.href
                  ? 'bg-[rgba(99,102,241,0.14)] text-[#e6e9ee]'
                  : 'text-[#8b94a1] hover:text-[#e6e9ee]'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          className="rounded-lg border border-[#232830] bg-[#171b21] px-3 py-1.5 text-[13px] text-[#e6e9ee] sm:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          ☰
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-[#232830] px-4 py-3 sm:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
                pathname === l.href
                  ? 'bg-[rgba(99,102,241,0.14)] text-[#e6e9ee]'
                  : 'text-[#8b94a1] hover:text-[#e6e9ee]'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Nav;
