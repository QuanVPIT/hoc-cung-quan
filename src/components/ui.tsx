// Các thành phần giao diện dùng chung
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../lib/cx';
import { speak } from '../lib/tts';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'soft' | 'ghost' | 'good' | 'bad' | 'outline';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-strong shadow-sm',
  soft: 'bg-primary-soft text-primary-ink hover:brightness-95',
  ghost: 'text-muted hover:bg-surface-2 hover:text-ink',
  good: 'bg-good text-white hover:brightness-110',
  bad: 'bg-bad-soft text-bad hover:brightness-95',
  outline: 'border border-line bg-surface text-ink hover:bg-surface-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: IconName }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition select-none disabled:opacity-45',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2.5',
        size === 'lg' && 'px-6 py-3.5 text-lg',
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 20} />}
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-line bg-surface p-4 sm:p-5', className)}>{children}</div>;
}

export function Chip({
  tone = 'muted',
  children,
  className,
}: {
  tone?: 'muted' | 'primary' | 'good' | 'bad' | 'warn';
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    muted: 'bg-surface-2 text-muted',
    primary: 'bg-primary-soft text-primary-ink',
    good: 'bg-good-soft text-good',
    bad: 'bg-bad-soft text-bad',
    warn: 'bg-warn-soft text-warn',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  className,
  tone = 'primary',
}: {
  value: number;
  className?: string;
  tone?: 'primary' | 'good';
}) {
  return (
    <div className={cx('h-2 overflow-hidden rounded-full bg-surface-2', className)}>
      <div
        className={cx(
          'h-full rounded-full transition-[width] duration-500',
          tone === 'good' ? 'bg-good' : 'bg-primary',
        )}
        style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }}
      />
    </div>
  );
}

/** Nút loa: bấm để nghe câu tiếng Anh. `slow` đọc chậm. */
export function SpeakButton({
  text,
  slow,
  size = 'md',
  className,
  label,
}: {
  text: string;
  slow?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const dim = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-14' : 'size-10';
  return (
    <button
      type="button"
      aria-label={label ?? (slow ? 'Nghe chậm' : 'Nghe')}
      title={label ?? (slow ? 'Nghe chậm' : 'Nghe')}
      onClick={async (e) => {
        e.stopPropagation();
        setBusy(true);
        await speak(text, { slow });
        setBusy(false);
      }}
      className={cx(
        'inline-flex flex-none items-center justify-center rounded-full transition',
        busy ? 'bg-primary text-white' : 'bg-primary-soft text-primary-ink hover:brightness-95',
        dim,
        className,
      )}
    >
      <Icon name={slow ? 'turtle' : 'volume'} size={size === 'lg' ? 26 : size === 'sm' ? 16 : 20} />
    </button>
  );
}

export function StarButton({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={on ? 'Bỏ đánh dấu' : 'Đánh dấu'}
      aria-pressed={on}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cx(
        'inline-flex size-8 flex-none items-center justify-center rounded-full transition hover:bg-surface-2',
        on ? 'text-warn' : 'text-muted/60',
      )}
    >
      <Icon name="star" size={18} fill={on} />
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span>
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative h-7 w-12 flex-none rounded-full transition', checked ? 'bg-primary' : 'bg-line')}
      >
        <span
          className={cx(
            'absolute top-1 size-5 rounded-full bg-white shadow transition-all',
            checked ? 'left-6' : 'left-1',
          )}
        />
      </button>
    </label>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-6 mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold">{children}</h2>
      {right}
    </div>
  );
}

export function Callout({
  icon = '💡',
  children,
  tone = 'warn',
}: {
  icon?: string;
  children: ReactNode;
  tone?: 'warn' | 'primary';
}) {
  return (
    <div
      className={cx(
        'flex gap-3 rounded-xl p-3 text-sm leading-relaxed',
        tone === 'warn' ? 'bg-warn-soft' : 'bg-primary-soft',
      )}
    >
      <span className="text-base leading-6">{icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <div className="text-5xl">{icon}</div>
      <div className="text-lg font-bold">{title}</div>
      {children && <div className="max-w-sm text-muted">{children}</div>}
    </div>
  );
}
