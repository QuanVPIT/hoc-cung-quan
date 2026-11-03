// Nút micro: nghe người học nói một câu rồi chấm, tô xanh từ đúng / đỏ từ thiếu.
import { useEffect, useRef, useState } from 'react';
import { cx } from '../lib/cx';
import { canRecognize, ERROR_TEXT, listen, scoreSpeech, SPEAK_PASS, type ListenSession } from '../lib/speech';
import type { CompareResult } from '../lib/text';
import { Icon } from './Icon';

export interface SpeakResult extends CompareResult {
  heard: string;
  pass: boolean;
}

export function SpeakCheck({
  target,
  onResult,
  compact,
}: {
  target: string;
  onResult?: (r: SpeakResult) => void;
  compact?: boolean;
}) {
  const [phase, setPhase] = useState<'idle' | 'listening' | 'done'>('idle');
  const [live, setLive] = useState('');
  const [result, setResult] = useState<SpeakResult | null>(null);
  const [error, setError] = useState('');
  const session = useRef<ListenSession | null>(null);

  useEffect(() => () => session.current?.stop(), []);

  if (!canRecognize())
    return (
      <p className="text-center text-sm text-muted">
        Trình duyệt này chưa hỗ trợ nhận giọng nói. Hãy đọc to câu mẫu, hoặc mở bằng Chrome / Safari để được chấm điểm.
      </p>
    );

  async function start() {
    if (phase === 'listening') {
      session.current?.stop();
      return;
    }
    setError('');
    setLive('');
    setResult(null);
    const s = listen({ onLive: setLive });
    if (!s) return;
    session.current = s;
    setPhase('listening');
    const r = await s.done;
    session.current = null;
    if (r.error && !r.heard.length) {
      setError(ERROR_TEXT[r.error] ?? `Lỗi micro: ${r.error}`);
      setPhase('idle');
      return;
    }
    const sc = scoreSpeech(r.heard, target);
    const res = { ...sc, pass: sc.score >= SPEAK_PASS };
    setResult(res);
    setPhase('done');
    onResult?.(res);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={start}
        aria-label={phase === 'listening' ? 'Dừng nghe' : 'Bấm để nói'}
        className={cx(
          'flex items-center justify-center rounded-full text-white shadow transition',
          compact ? 'size-14' : 'size-20',
          phase === 'listening' ? 'animate-pulse-ring bg-bad' : 'bg-primary hover:bg-primary-strong',
        )}
      >
        <Icon name={phase === 'listening' ? 'stop' : 'mic'} size={compact ? 26 : 34} />
      </button>
      <div className="min-h-6 text-center text-sm text-muted">
        {phase === 'listening'
          ? live || 'Đang nghe… nói đi bạn!'
          : phase === 'idle' && !error
            ? 'Bấm micro rồi đọc to câu'
            : ''}
      </div>
      {error && <p className="text-center text-sm text-bad">{error}</p>}
      {result && (
        <div className="flex w-full animate-fade flex-col items-center gap-2">
          <div className={cx('text-lg font-bold', result.pass ? 'text-good' : 'text-warn')}>
            {result.pass
              ? `Phát âm tốt! ${Math.round(result.score * 100)}%`
              : `Chưa chuẩn lắm — ${Math.round(result.score * 100)}%`}
          </div>
          <div className="flex flex-wrap justify-center gap-1">
            {result.target.map((t, i) => (
              <span
                key={i}
                className={cx(
                  'rounded-md px-1.5 py-0.5 font-medium',
                  t.ok ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad',
                )}
              >
                {t.word}
              </span>
            ))}
          </div>
          <div className="text-xs text-muted">Máy nghe được: “{result.heard || '…'}”</div>
        </div>
      )}
    </div>
  );
}
