'use client';

import Link from 'next/link';

type SidebarSection = 'control' | 'settings';

export default function DashboardSidebar({ active }: { active: SidebarSection }) {
  const itemClass = (isActive: boolean) =>
    `block rounded-xl px-4 py-3 text-sm transition-colors ${
      isActive ? 'bg-white text-black' : 'text-neutral-500 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <aside className="w-48 shrink-0 space-y-2 pt-1">
      <Link href="/" className={itemClass(false)}>
        Home
      </Link>
      <Link href="/dashboard" className={itemClass(active === 'control')}>
        Control
      </Link>
      <Link href="/dashboard/settings" className={itemClass(active === 'settings')}>
        Settings
      </Link>
      <Link href="/docs" className={itemClass(false)}>
        API Docs
      </Link>
      <a href="/api/v1/openapi.json" target="_blank" rel="noreferrer" className={itemClass(false)}>
        OpenAPI
      </a>
    </aside>
  );
}
