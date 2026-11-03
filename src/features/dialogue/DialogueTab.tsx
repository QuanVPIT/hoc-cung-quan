// Phần Hội thoại: nghe cả đoạn (tô sáng câu đang đọc), bật/tắt bản dịch, che tiếng Anh để luyện nghe, nhập vai.
import { useEffect, useRef, useState } from 'react';
import { Focus } from '../../components/Focus';
import { Button, Callout, Card, Toggle } from '../../components/ui';
import { cx } from '../../lib/cx';
import { speak, stopSpeaking } from '../../lib/tts';
import { useStore } from '../../store/AppStore';
import type { Dialogue, Unit } from '../../types/content';
import { RolePlay } from './RolePlay';

export function DialogueTab({ unit, onDone }: { unit: Unit; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [role, setRole] = useState<'A' | 'B' | null>(null);
  const d = unit.dialogues[index];
  const { markPart, state } = useStore();

  if (role)
    return (
      <Focus>
        <RolePlay
          dialogue={d}
          role={role}
          onExit={() => setRole(null)}
          onFinish={() => markPart(unit.id, 'dialogue')}
          onNext={
            index + 1 < unit.dialogues.length
              ? () => {
                  setRole(null);
                  setIndex(index + 1);
                }
              : onDone
          }
        />
      </Focus>
    );

  return (
    <div className="flex flex-col gap-4">
      {unit.dialogues.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {unit.dialogues.map((x, i) => (
            <button
              key={x.id}
              onClick={() => {
                stopSpeaking();
                setIndex(i);
              }}
              className={cx(
                'flex-none rounded-full px-4 py-2 text-sm font-semibold transition',
                i === index ? 'bg-primary text-white' : 'bg-surface-2 text-muted hover:text-ink',
              )}
            >
              {i + 1}. {x.vi}
            </button>
          ))}
        </div>
      )}
      <DialogueView key={d.id} dialogue={d} onRole={setRole} />
      {state.units[unit.id]?.parts.dialogue && (
        <p className="text-center text-sm text-good">✓ Bạn đã hoàn thành phần nhập vai của bài này.</p>
      )}
    </div>
  );
}

function DialogueView({ dialogue: d, onRole }: { dialogue: Dialogue; onRole: (r: 'A' | 'B') => void }) {
  const [showVi, setShowVi] = useState(true);
  const [hideEn, setHideEn] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const stopRef = useRef(false);

  useEffect(() => () => stopSpeaking(), []);

  async function playAll() {
    if (playing !== null) {
      stopRef.current = true;
      stopSpeaking();
      setPlaying(null);
      return;
    }
    stopRef.current = false;
    for (let i = 0; i < d.lines.length; i++) {
      if (stopRef.current) break;
      setPlaying(i);
      await speak(d.lines[i].en);
      await new Promise((r) => setTimeout(r, 350));
    }
    setPlaying(null);
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-bold">{d.title}</div>
          <div className="text-sm text-muted">
            {d.vi} · {d.a} & {d.b}
          </div>
        </div>
        <Button icon={playing !== null ? 'stop' : 'play'} onClick={playAll}>
          {playing !== null ? 'Dừng' : 'Nghe cả bài'}
        </Button>
      </div>

      <div className="grid gap-x-6 border-y border-line py-1 sm:grid-cols-2">
        <Toggle checked={showVi} onChange={setShowVi} label="Hiện bản dịch" />
        <Toggle checked={hideEn} onChange={setHideEn} label="Che tiếng Anh" hint="Luyện nghe hiểu" />
      </div>

      <div className="flex flex-col gap-3">
        {d.lines.map((l, i) => {
          const mine = l.who === 'B';
          return (
            <div key={i} className={cx('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
              <span className="px-1 text-xs font-semibold text-muted">{mine ? d.b : d.a}</span>
              <button
                onClick={() => {
                  setPlaying(null);
                  stopRef.current = true;
                  void speak(l.en);
                }}
                className={cx(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-left transition',
                  mine ? 'rounded-tr-sm bg-primary-soft' : 'rounded-tl-sm bg-surface-2',
                  playing === i && 'ring-2 ring-primary',
                )}
              >
                <div className={cx('font-medium', hideEn && playing !== i && 'blur-sm select-none')}>{l.en}</div>
                {showVi && <div className="text-sm text-muted">{l.vi}</div>}
              </button>
            </div>
          );
        })}
      </div>

      <Callout tone="primary" icon="🎭">
        <b>Nhập vai:</b> app đọc lời một người, bạn nói lời người còn lại. Chọn vai để bắt đầu.
      </Callout>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => onRole('A')}>
          Đóng vai {d.a}
        </Button>
        <Button variant="outline" onClick={() => onRole('B')}>
          Đóng vai {d.b}
        </Button>
      </div>
    </Card>
  );
}
