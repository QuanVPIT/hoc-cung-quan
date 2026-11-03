// Phần Luyện tập: 12 câu trộn nhiều dạng, chấm ngay từng câu, cuối bài báo điểm và các câu sai.
import { useMemo, useState } from 'react';
import { Focus } from '../../components/Focus';
import { Icon } from '../../components/Icon';
import { Button, Callout, Card, Chip, ProgressBar } from '../../components/ui';
import { cx } from '../../lib/cx';
import { pick } from '../../lib/random';
import { canRecognize } from '../../lib/speech';
import { stopSpeaking } from '../../lib/tts';
import { PASS_SCORE } from '../../store/progress';
import { useStore } from '../../store/AppStore';
import type { Unit } from '../../types/content';
import { buildPractice, randomPraise, TYPE_LABEL, type Question } from './buildPractice';
import { ChoiceExercise, DictationExercise, OrderExercise, SpeakExercise } from './Exercises';

export function PracticeTab({ unit, onNextUnit }: { unit: Unit; onNextUnit?: () => void }) {
  const { state } = useStore();
  const [round, setRound] = useState(0);
  const best = state.units[unit.id]?.best ?? 0;

  if (round === 0)
    return (
      <Card className="flex flex-col items-center gap-3 text-center">
        <div className="text-5xl">🎯</div>
        <h2 className="text-xl font-bold">Luyện tập bài {unit.no}</h2>
        <p className="max-w-md text-muted">
          12 câu: trắc nghiệm, điền từ, nghe chép, xếp câu{canRecognize() ? ' và luyện nói' : ''}. Đạt từ {PASS_SCORE}%
          là hoàn thành bài.
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {['meaning', 'listen', 'fill', 'dictation', 'order', ...(canRecognize() ? ['speak'] : [])].map((t) => (
            <Chip key={t}>{TYPE_LABEL[t as Question['type']]}</Chip>
          ))}
        </div>
        {best > 0 && (
          <p className={cx('font-semibold', best >= PASS_SCORE ? 'text-good' : 'text-warn')}>Điểm cao nhất: {best}%</p>
        )}
        <Button size="lg" onClick={() => setRound(1)}>
          Bắt đầu
        </Button>
      </Card>
    );

  return (
    <Focus>
      <PracticeRun
        key={round}
        unit={unit}
        onExit={() => setRound(0)}
        onRetry={() => setRound(round + 1)}
        onNextUnit={onNextUnit}
      />
    </Focus>
  );
}

function PracticeRun({
  unit,
  onExit,
  onRetry,
  onNextUnit,
}: {
  unit: Unit;
  onExit: () => void;
  onRetry: () => void;
  onNextUnit?: () => void;
}) {
  const { recordPractice } = useStore();
  const questions = useMemo(() => buildPractice(unit, { canSpeak: canRecognize() }), []);
  const [i, setI] = useState(0);
  // true đúng, false sai, null bỏ qua (không tính điểm)
  const [results, setResults] = useState<(boolean | null)[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const q = questions[i];
  const answered = results.length > i;
  const finished = results.length === questions.length && i >= questions.length;

  function onAnswer(correct: boolean | null) {
    if (answered) return;
    setResults((r) => [...r, correct]);
    setFeedback(
      correct === null
        ? 'Đã bỏ qua, không tính điểm'
        : correct
          ? randomPraise()
          : pick(['Chưa đúng rồi 😅', 'Sai mất rồi 🙈', 'Tiếc quá! 😬']),
    );
  }

  function next() {
    stopSpeaking();
    setFeedback(null);
    if (i + 1 >= questions.length) {
      recordPractice(
        unit.id,
        questions
          .map((x, k) => ({ cardId: x.cardId, correct: results[k] }))
          .filter((r): r is { cardId: string | undefined; correct: boolean } => r.correct !== null),
      );
    }
    setI(i + 1);
  }

  if (finished) {
    const correct = results.filter((r) => r === true).length;
    const counted = results.filter((r) => r !== null).length;
    const score = counted ? Math.round((correct / counted) * 100) : 0;
    const wrong = questions.filter((_, k) => results[k] === false);
    const pass = score >= PASS_SCORE;
    return (
      <div className="flex flex-col gap-4">
        <Card className="animate-pop text-center">
          <div className="text-5xl">{score === 100 ? '🏆' : pass ? '🎉' : '💪'}</div>
          <div className="mt-2 text-4xl font-extrabold">{score}%</div>
          <div className="text-muted">
            Đúng {correct}/{counted} câu{counted < questions.length && ` · bỏ qua ${questions.length - counted}`}
          </div>
          <p className={cx('mt-2 font-semibold', pass ? 'text-good' : 'text-warn')}>
            {pass ? `Hoàn thành bài ${unit.no}!` : `Cần ${PASS_SCORE}% để hoàn thành — thử lại nhé!`}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="ghost" onClick={onExit}>
              Về bài học
            </Button>
            <Button variant="outline" icon="refresh" onClick={onRetry}>
              Làm lại
            </Button>
            {pass && onNextUnit && (
              <Button icon="next" onClick={onNextUnit}>
                Sang bài tiếp
              </Button>
            )}
          </div>
        </Card>
        {wrong.length > 0 && (
          <Card>
            <h3 className="mb-3 font-bold">Xem lại câu sai</h3>
            <ul className="flex flex-col gap-2">
              {wrong.map((w, k) => (
                <li key={k} className="rounded-xl bg-surface-2 px-3 py-2">
                  <div className="text-xs font-semibold text-muted">{TYPE_LABEL[w.type]}</div>
                  {'word' in w ? (
                    <div>
                      <b>{w.word.en}</b> — {w.word.vi}
                    </div>
                  ) : (
                    <div>
                      <b>{w.en}</b>
                      <div className="text-sm text-muted">{w.vi}</div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">Các câu này đã được đưa vào phần Ôn tập để bạn gặp lại sớm.</p>
          </Card>
        )}
      </div>
    );
  }

  const correctNow = results[i];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onExit} className="rounded-full p-1.5 text-muted hover:bg-surface-2" aria-label="Thoát">
          <Icon name="x" />
        </button>
        <ProgressBar value={results.length / questions.length} className="flex-1" />
        <span className="text-sm font-semibold text-muted tabular-nums">
          {i + 1}/{questions.length}
        </span>
      </div>
      <Card key={i} className="flex animate-fade flex-col gap-4">
        <Chip tone="primary" className="self-start">
          {TYPE_LABEL[q.type]}
        </Chip>
        {(q.type === 'meaning' || q.type === 'reverse' || q.type === 'listen' || q.type === 'fill') && (
          <ChoiceExercise q={q} answered={answered} onAnswer={onAnswer} />
        )}
        {q.type === 'dictation' && <DictationExercise q={q} answered={answered} onAnswer={onAnswer} />}
        {q.type === 'order' && <OrderExercise q={q} answered={answered} onAnswer={onAnswer} />}
        {q.type === 'speak' && <SpeakExercise q={q} answered={answered} onAnswer={onAnswer} />}
      </Card>

      {answered && (
        <div
          className={cx(
            'sticky bottom-0 flex animate-fade items-center justify-between gap-3 rounded-2xl p-4',
            correctNow ? 'bg-good-soft' : correctNow === null ? 'bg-surface-2' : 'bg-bad-soft',
          )}
        >
          <div
            className={cx(
              'flex items-center gap-2 font-bold',
              correctNow ? 'text-good' : correctNow === null ? 'text-muted' : 'text-bad',
            )}
          >
            <Icon name={correctNow ? 'check' : correctNow === null ? 'next' : 'x'} />
            {feedback}
          </div>
          <Button variant={correctNow ? 'good' : 'primary'} onClick={next} autoFocus>
            {i + 1 >= questions.length ? 'Xem kết quả' : 'Tiếp tục'}
          </Button>
        </div>
      )}
      {!answered && 'options' in q && (
        <Callout tone="primary" icon="⌨️">
          <span className="hidden sm:inline">Trên máy tính: phím 1–4 để chọn, Enter để tiếp tục.</span>
          <span className="sm:hidden">Chọn đáp án, rồi bấm Tiếp tục.</span>
        </Callout>
      )}
    </div>
  );
}
