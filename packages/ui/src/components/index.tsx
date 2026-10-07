import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
}

export function Button({ children, variant = 'primary', ...rest }: ButtonProps) {
  const cls =
    variant === 'primary'
      ? 'min-h-[64px] min-w-[160px] rounded-3xl bg-orange-500 px-6 text-xl font-bold text-white shadow hover:scale-[1.02] active:scale-95 focus-visible:outline-4'
      : 'min-h-[64px] min-w-[160px] rounded-3xl border-2 px-6 text-xl font-bold focus-visible:outline-4';
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

interface AnswerCardProps {
  label: string;
  state?: 'idle' | 'correct' | 'wrong';
  onAnswer: () => void;
}

export function AnswerCard({ label, state = 'idle', onAnswer }: AnswerCardProps) {
  const cls =
    state === 'correct'
      ? 'border-green-600 bg-green-100'
      : state === 'wrong'
        ? 'border-red-600 bg-red-100'
        : 'border-slate-300 bg-white hover:scale-[1.02]';
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onAnswer}
      onPointerUp={onAnswer}
      className={`min-h-[80px] min-w-[160px] rounded-2xl border-4 p-4 text-3xl font-bold shadow ${cls}`}
      aria-label={`Réponse ${label}`}
    >
      {label}
    </button>
  );
}

export function TimerRing({ secondsLeft, total }: { secondsLeft: number; total: number }) {
  const pct = Math.max(0, Math.min(1, secondsLeft / total));
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`Temps restant ${secondsLeft} secondes`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={pct > 0.5 ? '#16a34a' : pct > 0.25 ? '#f59e0b' : '#dc2626'}
        strokeWidth="8"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round"
      />
    </svg>
  );
}
