// Một buổi học / ôn bằng thẻ: lật thẻ, tự chấm Quên / Khó / Nhớ / Dễ.
// Thẻ chấm "Quên" sẽ quay lại cuối hàng để gặp lại ngay trong buổi.
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Button, Card, Chip, ProgressBar, SpeakButton } from '../../components/ui';
import { cardById, type CardRef } from '../../data';
import { formatDays } from '../../lib/date';
import { cx } from '../../lib/cx';
import { GRADES, newCard, nextInterval, type Grade } from '../../lib/srs';
import { speak, stopSpeaking } from '../../lib/tts';
import { useStore } from '../../store/AppStore';

type Direction = 'learn' | 'en' | 'vi' | 'listen';

interface Props {
  ids: string[];
  /** learn: lần đầu học thẻ (luôn hiện đủ thông tin). review: ôn tập (đổi chiều ngẫu nhiên). */
  mode: 'learn' | 'review';
  onExit: () => void;
  /** Học / ôn xong (để màn hình gọi đánh dấu tiến độ) */
  onFinish?: () => void;
}

const MAX_REPEAT = 2;

function directionFor(ref: CardRef, mode: Props['mode'], seed: number): Direction {
  if (mode === 'learn') return 'learn';
  if (ref.kind === 'word') return seed % 2 ? 'vi' : 'en';
  return seed % 3 === 0 ? 'listen' : 'vi';
}

export function ReviewSession({ ids, mode, onExit, onFinish }: Props) {
  const { state, today, grade, toggleStar } = useStore();
  const [queue, setQueue] = useState(() => ids.filter((id) => cardById(id)));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0]);
  const [repeats, setRepeats] = useState<Record<string, number>>({});
  const total = useMemo(() => queue.length, []); // số thẻ ban đầu
  const id = queue[pos];
  const ref = id ? cardById(id) : undefined;
  const dir = ref ? directionFor(ref, mode, pos + id.length) : 'en';
  const done = pos >= queue.length;
  const { autoPlay, showIpa } = state.settings;

  const enText = ref ? (ref.kind === 'word' ? ref.word.en : ref.en) : '';

  // Tự đọc khi mở thẻ (chiều tiếng Anh / nghe) hoặc khi lật thẻ (chiều tiếng Việt)
  useEffect(() => {
    if (!ref || !autoPlay) return;
    if (!flipped && (dir === 'en' || dir === 'learn' || dir === 'listen')) void speak(enText);
    if (flipped && dir === 'vi') void speak(enText);
  }, [pos, flipped]);

  useEffect(() => {
    if (done) {
      stopSpeaking();
      onFinish?.();
    }
  }, [done]);

  function onGrade(g: Grade) {
    if (!id) return;
    grade(id, g);
    setCounts((c) => c.map((n, i) => (i === g ? n + 1 : n)));
    if (g === 0 && (repeats[id] ?? 0) < MAX_REPEAT) {
      setRepeats((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }));
      setQueue((q) => [...q, id]);
    }
    setFlipped(false);
    setPos((p) => p + 1);
  }

  // Phím tắt: Space/Enter lật thẻ, 1–4 chấm điểm
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      if ((e.key === ' ' || e.key === 'Enter') && !flipped) {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) onGrade((Number(e.key) - 1) as Grade);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (done) {
    const remembered = counts[2] + counts[3];
    return (
      <Card className="my-auto animate-pop text-center">
        <div className="text-5xl">{counts[0] === 0 ? '🏆' : '💪'}</div>
        <h2 className="mt-2 text-xl font-bold">{mode === 'learn' ? 'Học xong rồi!' : 'Ôn xong rồi!'}</h2>
        <p className="mt-1 text-muted">
          {total} thẻ · nhớ {remembered} lượt · quên {counts[0]} lượt
        </p>
        <div className="mx-auto mt-4 grid max-w-sm grid-cols-4 gap-2 text-sm">
          {GRADES.map((g) => (
            <div key={g.grade} className="rounded-xl bg-surface-2 p-2">
              <div className="text-lg font-bold">{counts[g.grade]}</div>
              <div className="text-muted">{g.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          App đã tự lên lịch ôn lại cho từng thẻ. Thẻ nào bạn quên sẽ quay lại sớm hơn.
        </p>
        <Button className="mt-4" onClick={onExit}>
          Xong
        </Button>
      </Card>
    );
  }
  if (!ref) return null;

  const card = state.cards[id] ?? newCard(today);
  const starred = state.starred.includes(id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onExit} className="rounded-full p-1.5 text-muted hover:bg-surface-2" aria-label="Thoát">
          <Icon name="x" />
        </button>
        <ProgressBar value={pos / queue.length} className="flex-1" />
        <span className="text-sm font-semibold text-muted tabular-nums">
          {pos + 1}/{queue.length}
        </span>
      </div>

      <div
        key={`${pos}`}
        role="button"
        tabIndex={0}
        onClick={() => !flipped && setFlipped(true)}
        className={cx(
          'flex min-h-[340px] animate-pop flex-col rounded-3xl border border-line bg-surface p-3 text-center shadow-sm',
          !flipped && 'cursor-pointer',
        )}
      >
        <div className="flex items-center justify-between">
          <Chip>
            Bài {ref.unit.no} · {ref.kind === 'word' ? 'Từ vựng' : 'Mẫu câu'}
          </Chip>
          <span className="flex items-center gap-1">
            {card.lapses >= 2 && <Chip tone="bad">Từ khó</Chip>}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleStar(id);
              }}
              className={cx('rounded-full p-1.5', starred ? 'text-warn' : 'text-muted/60')}
              aria-label="Đánh dấu"
            >
              <Icon name="star" size={18} fill={starred} />
            </button>
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-3 py-4">
          <Front refCard={ref} dir={dir} showIpa={showIpa} />
          {flipped ? (
            <div className="mt-2 flex w-full animate-fade flex-col items-center gap-3 border-t border-dashed border-line pt-4">
              <Back refCard={ref} dir={dir} showIpa={showIpa} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">{hintFor(dir)} · chạm để lật thẻ</p>
          )}
        </div>
      </div>

      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              onClick={() => onGrade(g.grade)}
              className={cx(
                'flex flex-col items-center rounded-2xl py-2.5 font-semibold transition hover:brightness-95',
                g.grade === 0 && 'bg-bad-soft text-bad',
                g.grade === 1 && 'bg-warn-soft text-warn',
                g.grade === 2 && 'bg-good-soft text-good',
                g.grade === 3 && 'bg-primary-soft text-primary-ink',
              )}
            >
              <span>{g.label}</span>
              <span className="text-xs font-medium opacity-80">{formatDays(nextInterval(card, g.grade, today))}</span>
            </button>
          ))}
        </div>
      ) : (
        <Button size="lg" onClick={() => setFlipped(true)}>
          Lật thẻ
        </Button>
      )}
      <p className="hidden text-center text-xs text-muted sm:block">Phím tắt: Space để lật · 1 2 3 4 để chấm</p>
    </div>
  );
}

const hintFor = (dir: Direction) =>
  dir === 'en'
    ? 'Nhớ nghĩa tiếng Việt'
    : dir === 'vi'
      ? 'Nói to bằng tiếng Anh'
      : dir === 'listen'
        ? 'Nghe và hiểu nghĩa'
        : 'Đọc to theo';

function Front({ refCard: r, dir, showIpa }: { refCard: CardRef; dir: Direction; showIpa: boolean }) {
  if (r.kind === 'word') {
    const w = r.word;
    if (dir === 'vi')
      return (
        <>
          <div className="text-6xl">{w.emoji}</div>
          <div className="text-2xl font-bold">{w.vi}</div>
        </>
      );
    return (
      <>
        {dir === 'learn' && <div className="text-6xl">{w.emoji}</div>}
        <div className="text-4xl font-extrabold tracking-tight">{w.en}</div>
        {showIpa && <div className="font-mono text-muted">{w.ipa}</div>}
        <div className="flex gap-2">
          <SpeakButton text={w.en} />
          <SpeakButton text={w.en} slow />
        </div>
      </>
    );
  }
  if (dir === 'listen')
    return (
      <>
        <SpeakButton text={r.en} size="lg" />
        <SpeakButton text={r.en} slow size="sm" />
      </>
    );
  return (
    <>
      <Chip tone="primary">{r.pattern.form}</Chip>
      <div className="text-xl leading-relaxed font-bold">{r.vi}</div>
    </>
  );
}

function Back({ refCard: r, dir, showIpa }: { refCard: CardRef; dir: Direction; showIpa: boolean }) {
  if (r.kind === 'word') {
    const w = r.word;
    return (
      <>
        {dir === 'vi' ? (
          <>
            <div className="text-3xl font-extrabold">{w.en}</div>
            {showIpa && <div className="font-mono text-muted">{w.ipa}</div>}
            <SpeakButton text={w.en} size="sm" />
          </>
        ) : (
          <>
            {dir === 'en' && <div className="text-4xl">{w.emoji}</div>}
            <div className="text-2xl font-bold text-primary">{w.vi}</div>
          </>
        )}
        <div className="flex items-start gap-2 rounded-xl bg-surface-2 px-3 py-2 text-left">
          <SpeakButton text={w.ex.en} size="sm" />
          <div>
            <div className="font-medium">{w.ex.en}</div>
            <div className="text-sm text-muted">{w.ex.vi}</div>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="flex items-center gap-2">
        <div className="text-xl font-bold">{r.en}</div>
        <SpeakButton text={r.en} size="sm" />
      </div>
      {dir === 'listen' && <div className="text-muted">{r.vi}</div>}
      <div className="max-w-md text-sm text-muted">💡 {r.pattern.note}</div>
    </>
  );
}
