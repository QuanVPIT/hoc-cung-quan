// Phần Từ vựng: danh sách từ có phiên âm, ví dụ; học bằng thẻ để đưa vào lịch ôn.
import { useState } from 'react';
import { Button, Callout, Card, Chip, SpeakButton, StarButton } from '../../components/ui';
import { STATUS_LABEL, statusOf } from '../../lib/srs';
import { useStore } from '../../store/AppStore';
import type { Unit } from '../../types/content';
import { ReviewSession } from '../review/ReviewSession';
import { Focus } from '../../components/Focus';

const STATUS_TONE = { new: 'muted', learning: 'warn', young: 'primary', mature: 'good' } as const;

export function VocabTab({ unit }: { unit: Unit }) {
  const { state, toggleStar } = useStore();
  const [studying, setStudying] = useState<string[] | null>(null);
  const fresh = unit.words.filter((w) => !state.cards[w.id]);

  if (studying)
    return (
      <Focus>
        <ReviewSession ids={studying} mode="learn" onExit={() => setStudying(null)} />
      </Focus>
    );

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-bold">
            {fresh.length ? `${fresh.length} từ mới chưa học` : 'Đã học hết từ của bài này 🎉'}
          </div>
          <div className="text-sm text-muted">
            Học bằng thẻ: nghe, đọc to, rồi tự chấm. App sẽ nhắc ôn đúng lúc bạn sắp quên.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {fresh.length > 0 ? (
            <Button onClick={() => setStudying(fresh.map((w) => w.id))}>Học {fresh.length} từ mới</Button>
          ) : (
            <Button variant="soft" onClick={() => setStudying(unit.words.map((w) => w.id))}>
              Học lại cả bài
            </Button>
          )}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {unit.words.map((w) => {
          const status = statusOf(state.cards[w.id]);
          return (
            <Card key={w.id} className="flex flex-col gap-2 p-4!">
              <div className="flex items-start gap-3">
                <div className="text-4xl leading-none">{w.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-lg font-bold">{w.en}</span>
                    {state.settings.showIpa && <span className="font-mono text-sm text-muted">{w.ipa}</span>}
                  </div>
                  <div className="text-primary">{w.vi}</div>
                </div>
                <SpeakButton text={w.en} size="sm" />
                <StarButton on={state.starred.includes(w.id)} onClick={() => toggleStar(w.id)} />
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-surface-2 px-3 py-2">
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-medium">{w.ex.en}</div>
                  <div className="text-muted">{w.ex.vi}</div>
                </div>
                <SpeakButton text={w.ex.en} size="sm" />
              </div>
              <div>
                <Chip tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Chip>
              </div>
            </Card>
          );
        })}
      </div>

      <Callout>
        <b>Mẹo học từ:</b> đọc to cả câu ví dụ thay vì chỉ một từ — bạn sẽ nhớ cách dùng chứ không chỉ nghĩa.
      </Callout>
    </div>
  );
}
