import type { ReactNode } from 'react';
import { href } from '../lib/router';
import { cx } from '../lib/cx';
import { dueCards } from '../store/progress';
import { useStore } from '../store/AppStore';
import { Icon, type IconName } from './Icon';

const TABS: { path: string; label: string; icon: IconName }[] = [
  { path: '', label: 'Lộ trình', icon: 'home' },
  { path: 'review', label: 'Ôn tập', icon: 'review' },
  { path: 'notebook', label: 'Sổ tay', icon: 'book' },
  { path: 'progress', label: 'Tiến độ', icon: 'chart' },
];

export function Layout({ section, children }: { section: string; children: ReactNode }) {
  const { state, today } = useStore();
  const due = dueCards(state, today).length;
  return (
    <div className="min-h-dvh pb-[calc(76px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <a href={href('')} className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className="text-2xl">🗣️</span>
            <span>
              Học cùng <span className="text-primary">Quân</span>
            </span>
          </a>
          <a
            href={href('settings')}
            aria-label="Cài đặt"
            className={cx(
              'rounded-full p-2 transition hover:bg-surface-2',
              section === 'settings' ? 'text-primary' : 'text-muted',
            )}
          >
            <Icon name="settings" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-4">
          {TABS.map((t) => {
            const active = section === t.path;
            return (
              <a
                key={t.path}
                href={href(t.path)}
                className={cx(
                  'relative flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition',
                  active ? 'text-primary' : 'text-muted hover:text-ink',
                )}
              >
                <span className="relative">
                  <Icon name={t.icon} size={22} />
                  {t.path === 'review' && due > 0 && (
                    <span className="absolute -top-1.5 -right-3 min-w-5 rounded-full bg-bad px-1 text-center text-[10px] leading-5 text-white">
                      {due > 99 ? '99+' : due}
                    </span>
                  )}
                </span>
                {t.label}
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
