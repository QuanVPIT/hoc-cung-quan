// Nhập vai: app đọc lời người kia; tới lượt bạn thì xem gợi ý tiếng Việt và nói câu tiếng Anh.
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { SpeakCheck } from '../../components/SpeakCheck';
import { Button, Card, ProgressBar, SpeakButton } from '../../components/ui';
import { cx } from '../../lib/cx';
import { speak, stopSpeaking } from '../../lib/tts';
import type { Dialogue } from '../../types/content';

interface Props {
  dialogue: Dialogue;
  role: 'A' | 'B';
  onExit: () => void;
  onFinish: () => void;
  onNext: () => void;
}

export function RolePlay({ dialogue: d, role, onExit, onFinish, onNext }: Props) {
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const line = d.lines[step];
  const done = step >= d.lines.length;
  const myTurn = !done && line.who === role;
  const me = role === 'A' ? d.a : d.b;
  const partner = role === 'A' ? d.b : d.a;

  // Lượt người kia: app đọc rồi tự chuyển sang câu tiếp
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    if (done) {
      onFinish();
      return;
    }
    if (!myTurn) {
      let alive = true;
      void speak(line.en).then(() => alive && setTimeout(() => alive && setStep((s) => s + 1), 400));
      return () => {
        alive = false;
      };
    }
  }, [step]);

  useEffect(() => () => stopSpeaking(), []);

  const next = () => {
    setRevealed(false);
    setStep((s) => s + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onExit} className="rounded-full p-1.5 text-muted hover:bg-surface-2" aria-label="Thoát">
          <Icon name="x" />
        </button>
        <ProgressBar value={step / d.lines.length} className="flex-1" />
        <span className="text-sm font-semibold text-muted">Bạn là {me}</span>
      </div>

      <Card className="flex flex-col gap-3">
        {d.lines.slice(0, Math.min(step, d.lines.length)).map((l, i) => {
          const mine = l.who === role;
          return (
            <div key={i} className={cx('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
              <span className="px-1 text-xs font-semibold text-muted">{mine ? `${me} (bạn)` : partner}</span>
              <div className={cx('max-w-[85%] rounded-2xl px-4 py-2', mine ? 'bg-primary-soft' : 'bg-surface-2')}>
                <div className="font-medium">{l.en}</div>
                <div className="text-sm text-muted">{l.vi}</div>
              </div>
            </div>
          );
        })}

        {!done && !myTurn && (
          <div className="flex items-start">
            <div className="flex max-w-[85%] animate-fade items-center gap-2 rounded-2xl bg-surface-2 px-4 py-2">
              <Icon name="volume" size={18} className="text-primary" />
              <span className="font-medium">{line.en}</span>
            </div>
          </div>
        )}

        {myTurn && (
          <div className="flex animate-fade flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/50 p-4 text-center">
            <div className="text-sm font-semibold text-primary">Lượt của bạn — nói bằng tiếng Anh:</div>
            <div className="text-lg font-bold">“{line.vi}”</div>
            {revealed ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{line.en}</span>
                <SpeakButton text={line.en} size="sm" />
              </div>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="flex items-center gap-1 text-sm text-muted underline"
              >
                <Icon name="eye" size={16} /> Xem câu mẫu
              </button>
            )}
            <SpeakCheck key={step} target={line.en} compact onResult={() => setRevealed(true)} />
            <Button onClick={next} variant="soft" icon="next">
              Câu tiếp
            </Button>
          </div>
        )}

        {done && (
          <div className="flex animate-pop flex-col items-center gap-3 py-4 text-center">
            <div className="text-5xl">🎭</div>
            <div className="text-lg font-bold">Hoàn thành nhập vai!</div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" icon="refresh" onClick={() => setStep(0)}>
                Nhập vai lại
              </Button>
              <Button onClick={onNext}>Tiếp tục</Button>
            </div>
          </div>
        )}
        <div ref={bottom} />
      </Card>
    </div>
  );
}
