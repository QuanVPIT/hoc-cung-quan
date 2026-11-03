// Giao diện từng dạng câu luyện tập. Mỗi dạng gọi onAnswer(đúng/sai) đúng một lần.
import { useEffect, useRef, useState } from 'react';
import { SpeakCheck } from '../../components/SpeakCheck';
import { Button, SpeakButton } from '../../components/ui';
import { cx } from '../../lib/cx';
import { compare, type CompareResult } from '../../lib/text';
import { speak } from '../../lib/tts';
import { orderCorrect, type Question } from './buildPractice';

export interface ExerciseProps<T extends Question['type']> {
  q: Extract<Question, { type: T }>;
  answered: boolean;
  /** true đúng, false sai, null bỏ qua (không tính điểm) */
  onAnswer: (correct: boolean | null) => void;
}

// ---------- Trắc nghiệm (nghĩa, chọn từ, nghe, điền từ) ----------
export function ChoiceExercise({ q, answered, onAnswer }: ExerciseProps<'meaning' | 'reverse' | 'listen' | 'fill'>) {
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    if (q.type === 'listen' || q.type === 'meaning') void speak(q.word.en);
  }, []);

  // Phím 1–4 để chọn
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1;
      if (!answered && i >= 0 && i < q.options.length) choose(q.options[i]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function choose(o: string) {
    if (answered) return;
    setPicked(o);
    onAnswer(o === q.answer);
    if (q.type !== 'meaning') void speak(q.type === 'fill' ? q.word.ex.en : q.word.en);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 text-center">
        {q.type === 'meaning' && (
          <>
            <div className="text-3xl font-extrabold">{q.word.en}</div>
            <SpeakButton text={q.word.en} />
          </>
        )}
        {q.type === 'reverse' && (
          <>
            <div className="text-5xl">{q.word.emoji}</div>
            <div className="text-2xl font-bold">{q.word.vi}</div>
          </>
        )}
        {q.type === 'listen' && (
          <div className="flex items-center gap-3">
            <SpeakButton text={q.word.en} size="lg" />
            <SpeakButton text={q.word.en} slow />
          </div>
        )}
        {q.type === 'fill' && (
          <>
            <div className="text-xl leading-relaxed font-semibold">
              {q.before}
              <span
                className={cx(
                  'mx-1 inline-block min-w-20 border-b-2 px-1',
                  answered ? 'border-good text-good' : 'border-primary text-transparent',
                )}
              >
                {answered ? q.answer : '_'}
              </span>
              {q.after}
            </div>
            <div className="text-muted">{q.word.ex.vi}</div>
          </>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {q.options.map((o, i) => {
          const isAnswer = o === q.answer;
          const isPicked = o === picked;
          return (
            <button
              key={o}
              disabled={answered}
              onClick={() => choose(o)}
              className={cx(
                'flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition',
                !answered && 'border-line bg-surface hover:border-primary',
                answered && isAnswer && 'border-good bg-good-soft text-good',
                answered && isPicked && !isAnswer && 'animate-shake border-bad bg-bad-soft text-bad',
                answered && !isAnswer && !isPicked && 'border-line opacity-50',
              )}
            >
              <span className="hidden size-6 flex-none items-center justify-center rounded-md bg-surface-2 text-xs text-muted sm:flex">
                {i + 1}
              </span>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Nghe chép ----------
export function DictationExercise({ q, answered, onAnswer }: ExerciseProps<'dictation'>) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void speak(q.en);
    input.current?.focus();
  }, []);

  function check() {
    if (answered || !text.trim()) return;
    const r = compare(text, q.en);
    setResult(r);
    onAnswer(r.exact);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <SpeakButton text={q.en} size="lg" />
        <SpeakButton text={q.en} slow />
      </div>
      <p className="text-sm text-muted">Nghe bao nhiêu lần cũng được. Không cần đúng dấu câu và chữ hoa.</p>
      <textarea
        ref={input}
        value={text}
        disabled={answered}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            check();
          }
        }}
        rows={2}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Gõ câu bạn nghe được…"
        className="w-full resize-none rounded-2xl border-2 border-line bg-surface px-4 py-3 text-lg outline-none focus:border-primary"
      />
      {!answered && (
        <Button className="w-full" disabled={!text.trim()} onClick={check}>
          Kiểm tra
        </Button>
      )}
      {result && (
        <div className="flex w-full flex-col items-center gap-2">
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
          <div className="text-center">
            <div className="font-semibold">{q.en}</div>
            <div className="text-sm text-muted">{q.vi}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Xếp câu ----------
export function OrderExercise({ q, answered, onAnswer }: ExerciseProps<'order'>) {
  // Lưu vị trí ô (không lưu chữ) để xử lý được ô trùng chữ
  const [picked, setPicked] = useState<number[]>([]);
  const words = picked.map((i) => q.tiles[i]);

  function check() {
    if (answered) return;
    const ok = orderCorrect(words, q.en);
    onAnswer(ok);
    void speak(q.en);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center text-lg font-semibold">“{q.vi}”</div>
      <div
        className={cx(
          'flex min-h-16 flex-wrap content-start gap-2 rounded-2xl border-2 border-dashed p-3',
          answered ? 'border-line' : 'border-primary/40',
        )}
      >
        {picked.map((ti, k) => (
          <button
            key={`${ti}-${k}`}
            disabled={answered}
            onClick={() => setPicked(picked.filter((_, j) => j !== k))}
            className="animate-pop rounded-xl border border-line bg-primary-soft px-3 py-1.5 font-semibold text-primary-ink"
          >
            {q.tiles[ti]}
          </button>
        ))}
        {!picked.length && <span className="self-center text-sm text-muted">Chạm các ô bên dưới theo đúng thứ tự</span>}
      </div>
      <div className={cx('flex flex-wrap justify-center gap-2', answered && 'hidden')}>
        {q.tiles.map((t, i) => (
          <button
            key={i}
            disabled={answered || picked.includes(i)}
            onClick={() => setPicked([...picked, i])}
            className={cx(
              'rounded-xl border border-line bg-surface px-3 py-1.5 font-semibold shadow-sm transition',
              picked.includes(i) ? 'opacity-0' : 'hover:border-primary',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {!answered && (
        <Button disabled={picked.length !== q.tiles.length} onClick={check}>
          Kiểm tra
        </Button>
      )}
      {answered && (
        <div className="flex items-center justify-center gap-2 text-center">
          <span className="font-semibold">{q.en}</span>
          <SpeakButton text={q.en} size="sm" />
        </div>
      )}
    </div>
  );
}

// ---------- Nói ----------
export function SpeakExercise({ q, answered, onAnswer }: ExerciseProps<'speak'>) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex items-center gap-2">
        <div className="text-xl font-bold">{q.en}</div>
        <SpeakButton text={q.en} size="sm" />
      </div>
      <div className="text-muted">{q.vi}</div>
      <SpeakCheck target={q.en} onResult={(r) => !answered && onAnswer(r.pass)} />
      {!answered && (
        <button className="text-sm text-muted underline" onClick={() => onAnswer(null)}>
          Không nói được lúc này — bỏ qua
        </button>
      )}
    </div>
  );
}
