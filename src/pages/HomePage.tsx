// Lộ trình: việc cần làm hôm nay + 4 chặng, 20 bài.
import { Icon } from '../components/Icon';
import { Button, Card, Chip, ProgressBar } from '../components/ui';
import { STAGES, UNITS } from '../data';
import { cx } from '../lib/cx';
import { href, navigate } from '../lib/router';
import { dueCards, nextUnit, streak, UNIT_PARTS, unitParts } from '../store/progress';
import { useStore } from '../store/AppStore';

export function HomePage() {
  const { state, today } = useStore();
  const due = dueCards(state, today).length;
  const next = nextUnit(state);
  const days = streak(state.activity, today);
  const doneUnits = UNITS.filter((u) => Object.values(unitParts(state, u)).every(Boolean)).length;
  const fresh = Object.keys(state.cards).length === 0;

  return (
    <div className="flex flex-col gap-4 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-primary to-primary-strong p-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm/6 opacity-85">{fresh ? 'Chào mừng bạn 👋' : 'Chào bạn, học tiếp nào 👋'}</div>
            <h1 className="text-2xl font-extrabold tracking-tight">Tiếng Anh giao tiếp A1 → A2</h1>
          </div>
          <div className="flex flex-none flex-col items-center rounded-2xl bg-white/15 px-3 py-1.5">
            <span className="flex items-center gap-1 text-xl font-extrabold">
              <Icon name="flame" size={18} /> {days}
            </span>
            <span className="text-[11px] opacity-85">ngày liên tiếp</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <ProgressBar value={doneUnits / UNITS.length} className="flex-1 bg-white/25 [&>div]:bg-white" />
          <span className="font-semibold">
            {doneUnits}/{UNITS.length} bài
          </span>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-muted">Ôn tập hôm nay</div>
          <div className="text-2xl font-extrabold">{due ? `${due} thẻ` : fresh ? 'Chưa có thẻ' : 'Xong rồi ✓'}</div>
          <p className="text-sm text-muted">
            {due
              ? 'Ôn đúng lúc sắp quên giúp nhớ lâu gấp nhiều lần.'
              : fresh
                ? 'Học từ vựng ở Bài 1, thẻ sẽ tự xuất hiện ở đây theo lịch ôn.'
                : 'Không có thẻ nào đến hạn. Học bài mới thôi!'}
          </p>
          <Button className="mt-auto" variant={due ? 'primary' : 'soft'} onClick={() => navigate('review')}>
            {due ? 'Ôn ngay' : 'Xem phần ôn tập'}
          </Button>
        </Card>
        <Card className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-muted">{fresh ? 'Bắt đầu từ đây' : 'Học tiếp'}</div>
          <div className="text-2xl font-extrabold">
            {next.emoji} Bài {next.no}
          </div>
          <p className="text-sm text-muted">
            {next.title} — {next.vi}
          </p>
          <Button className="mt-auto" onClick={() => navigate(`unit/${next.id}`)}>
            {fresh ? 'Vào bài 1' : 'Tiếp tục học'}
          </Button>
        </Card>
      </div>

      {STAGES.map((s) => (
        <section key={s.id} className="mt-2">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xl">{s.emoji}</span>
            <h2 className="text-lg font-bold">
              Chặng {s.id}: {s.vi}
            </h2>
            <Chip tone="primary">{s.level}</Chip>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {UNITS.filter((u) => u.stage === s.id).map((u) => {
              const parts = unitParts(state, u);
              const n = UNIT_PARTS.filter((p) => parts[p]).length;
              const done = n === UNIT_PARTS.length;
              const best = state.units[u.id]?.best ?? 0;
              return (
                <a
                  key={u.id}
                  href={href(`unit/${u.id}`)}
                  className={cx(
                    'flex items-center gap-3 rounded-2xl border bg-surface p-3 transition hover:border-primary hover:shadow-sm',
                    u.id === next.id ? 'border-primary/60' : 'border-line',
                  )}
                >
                  <div
                    className={cx(
                      'flex size-12 flex-none items-center justify-center rounded-xl text-2xl',
                      done ? 'bg-good-soft' : 'bg-surface-2',
                    )}
                  >
                    {u.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted">Bài {u.no}</span>
                      {done && <Chip tone="good">✓ Xong</Chip>}
                      {!done && best > 0 && <Chip tone="warn">{best}%</Chip>}
                    </div>
                    <div className="truncate font-bold">{u.title}</div>
                    <div className="truncate text-sm text-muted">{u.vi}</div>
                    <div className="mt-1.5 flex gap-1">
                      {UNIT_PARTS.map((p) => (
                        <span
                          key={p}
                          className={cx('h-1.5 flex-1 rounded-full', parts[p] ? 'bg-good' : 'bg-surface-2')}
                        />
                      ))}
                    </div>
                  </div>
                  <Icon name="next" className="flex-none text-muted" />
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
