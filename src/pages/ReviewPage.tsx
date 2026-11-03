// Ôn tập hôm nay: các thẻ đến hạn theo lịch ôn ngắt quãng.
import { useState } from 'react';
import { Focus } from '../components/Focus';
import { Button, Callout, Card, Empty } from '../components/ui';
import { ReviewSession } from '../features/review/ReviewSession';
import { formatDays } from '../lib/date';
import { navigate } from '../lib/router';
import { cardStats, dueCards, upcomingCards } from '../store/progress';
import { useStore } from '../store/AppStore';

export function ReviewPage() {
  const { state, today } = useStore();
  const [session, setSession] = useState<string[] | null>(null);
  const due = dueCards(state, today);
  const size = state.settings.sessionSize;
  const stats = cardStats(state);
  const total = Object.keys(state.cards).length;
  const nextDue = Object.values(state.cards)
    .map((c) => c.due)
    .filter((d) => d > today)
    .sort((a, b) => a - b)[0];
  const hard = Object.entries(state.cards)
    .filter(([, c]) => c.lapses >= 2)
    .map(([id]) => id);

  if (session)
    return (
      <Focus>
        <ReviewSession key={session.join()} ids={session} mode="review" onExit={() => setSession(null)} />
      </Focus>
    );

  return (
    <div className="flex flex-col gap-4 pb-6">
      <h1 className="text-2xl font-extrabold">Ôn tập</h1>
      {total === 0 ? (
        <Card>
          <Empty icon="🗂️" title="Chưa có thẻ nào để ôn">
            Vào một bài học, học từ vựng bằng thẻ hoặc thêm mẫu câu vào ôn tập — thẻ sẽ xuất hiện ở đây theo lịch.
          </Empty>
          <div className="flex justify-center">
            <Button onClick={() => navigate('')}>Về lộ trình</Button>
          </div>
        </Card>
      ) : due.length ? (
        <Card className="flex flex-col items-center gap-3 text-center">
          <div className="text-5xl">🧠</div>
          <div className="text-3xl font-extrabold">{due.length} thẻ đến hạn</div>
          <p className="text-muted">
            {due.length > size ? `Mỗi buổi ôn ${size} thẻ (đổi trong Cài đặt). ` : ''}Mất khoảng{' '}
            {Math.max(1, Math.round(Math.min(due.length, size) * 0.15))} phút.
          </p>
          <Button size="lg" onClick={() => setSession(due.slice(0, size))}>
            Bắt đầu ôn
          </Button>
        </Card>
      ) : (
        <Card className="flex flex-col items-center gap-3 text-center">
          <div className="text-5xl">✅</div>
          <div className="text-xl font-bold">Hôm nay ôn xong rồi!</div>
          <p className="text-muted">
            {nextDue !== undefined && `Lượt ôn tiếp theo: sau ${formatDays(nextDue - today)}.`}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="soft" onClick={() => setSession(upcomingCards(state, today, 15))}>
              Ôn sớm 15 thẻ
            </Button>
            <Button onClick={() => navigate('')}>Học bài mới</Button>
          </div>
        </Card>
      )}

      {total > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Card className="p-3!">
              <div className="text-2xl font-extrabold text-warn">{stats.learning}</div>
              <div className="text-xs text-muted">Đang học</div>
            </Card>
            <Card className="p-3!">
              <div className="text-2xl font-extrabold text-primary">{stats.young}</div>
              <div className="text-xs text-muted">Đã nhớ</div>
            </Card>
            <Card className="p-3!">
              <div className="text-2xl font-extrabold text-good">{stats.mature}</div>
              <div className="text-xs text-muted">Thuộc lâu</div>
            </Card>
          </div>
          {hard.length > 0 && (
            <Card className="flex items-center justify-between gap-3">
              <div>
                <div className="font-bold">Từ khó: {hard.length}</div>
                <div className="text-sm text-muted">Những thẻ bạn đã quên từ 2 lần trở lên.</div>
              </div>
              <Button variant="bad" onClick={() => setSession(hard.slice(0, size))}>
                Ôn từ khó
              </Button>
            </Card>
          )}
        </>
      )}

      <Callout icon="📚">
        <b>Cách chấm:</b> <b>Quên</b> — không nhớ ra; <b>Khó</b> — nhớ nhưng phải nghĩ lâu; <b>Nhớ</b> — nhớ được;{' '}
        <b>Dễ</b> — nhớ ngay. Hãy chấm thật lòng, app sẽ tự tính ngày ôn lại phù hợp.
      </Callout>
    </div>
  );
}
