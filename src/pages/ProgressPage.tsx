// Tiến độ: chuỗi ngày học, lịch học 12 tuần, thống kê thẻ, tiến độ từng chặng, sao lưu dữ liệu.
import { useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, Callout, Card, ProgressBar, SectionTitle } from '../components/ui';
import { ALL_CARD_IDS, STAGES, UNITS } from '../data';
import { cx } from '../lib/cx';
import { dayKey } from '../lib/date';
import { cardStats, parseBackup, streak, unitDone } from '../store/progress';
import { useStore } from '../store/AppStore';

const WEEKS = 12;

export function ProgressPage() {
  const { state, today, replace, reset } = useStore();
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const stats = cardStats(state);
  const learned = Object.keys(state.cards).length;
  const days = streak(state.activity, today);
  const activeDays = Object.keys(state.activity).length;
  const totalReviews = Object.values(state.activity).reduce((a, b) => a + b, 0);

  // Lưới 12 tuần, cột = tuần, hàng = thứ (Thứ Hai trên cùng)
  const weekday = (new Date(today * 86_400_000).getUTCDay() + 6) % 7;
  const start = today - weekday - (WEEKS - 1) * 7;
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => start + Math.floor(i / 7) * 7 + (i % 7));
  const level = (n: number) => (n === 0 ? 0 : n < 10 ? 1 : n < 30 ? 2 : 3);

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hoc-cung-quan-${dayKey(today)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg('Đã tải file sao lưu về máy.');
  }

  async function importBackup(f: File) {
    const data = parseBackup(await f.text());
    if (!data) return setMsg('File không đúng định dạng sao lưu của app.');
    if (!confirm('Thay toàn bộ tiến độ hiện tại bằng dữ liệu trong file?')) return;
    replace(data);
    setMsg('Đã khôi phục tiến độ từ file.');
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <h1 className="text-2xl font-extrabold">Tiến độ</h1>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { v: days, l: 'ngày liên tiếp', icon: '🔥' },
          { v: `${learned}/${ALL_CARD_IDS.length}`, l: 'thẻ đã học', icon: '🗂️' },
          { v: stats.mature, l: 'thuộc lâu', icon: '🧠' },
          { v: `${UNITS.filter((u) => unitDone(state, u)).length}/20`, l: 'bài hoàn thành', icon: '🏁' },
        ].map((x) => (
          <Card key={x.l} className="p-3! text-center">
            <div className="text-xl">{x.icon}</div>
            <div className="text-2xl font-extrabold">{x.v}</div>
            <div className="text-xs text-muted">{x.l}</div>
          </Card>
        ))}
      </div>

      <SectionTitle
        right={
          <span className="text-sm text-muted">
            {activeDays} ngày học · {totalReviews} lượt
          </span>
        }
      >
        Lịch học 12 tuần
      </SectionTitle>
      <Card>
        <div
          className="grid grid-flow-col grid-rows-7 gap-1"
          style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
        >
          {cells.map((d) => {
            const n = d > today ? -1 : (state.activity[dayKey(d)] ?? 0);
            return (
              <div
                key={d}
                title={n >= 0 ? `${dayKey(d)}: ${n} lượt` : ''}
                className={cx(
                  'aspect-square rounded-[4px]',
                  n < 0 && 'opacity-0',
                  n >= 0 && level(n) === 0 && 'bg-surface-2',
                  level(n) === 1 && 'bg-primary/30',
                  level(n) === 2 && 'bg-primary/60',
                  level(n) === 3 && 'bg-primary',
                  d === today && 'ring-2 ring-ink/30',
                )}
              />
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted">
          Ít
          {['bg-surface-2', 'bg-primary/30', 'bg-primary/60', 'bg-primary'].map((c) => (
            <span key={c} className={cx('size-3 rounded-[3px]', c)} />
          ))}
          Nhiều
        </div>
      </Card>

      <SectionTitle>Trạng thái thẻ</SectionTitle>
      <Card className="flex flex-col gap-3">
        <div className="flex h-3 overflow-hidden rounded-full bg-surface-2">
          {[
            { n: stats.learning, c: 'bg-warn' },
            { n: stats.young, c: 'bg-primary' },
            { n: stats.mature, c: 'bg-good' },
          ].map((x, i) => (
            <div key={i} className={x.c} style={{ width: `${(x.n / ALL_CARD_IDS.length) * 100}%` }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Legend c="bg-warn" l={`Đang học: ${stats.learning}`} />
          <Legend c="bg-primary" l={`Đã nhớ: ${stats.young}`} />
          <Legend c="bg-good" l={`Thuộc lâu: ${stats.mature}`} />
          <Legend c="bg-surface-2" l={`Chưa học: ${ALL_CARD_IDS.length - learned}`} />
        </div>
      </Card>

      <SectionTitle>Theo chặng</SectionTitle>
      <Card className="flex flex-col gap-3">
        {STAGES.map((s) => {
          const units = UNITS.filter((u) => u.stage === s.id);
          const done = units.filter((u) => unitDone(state, u)).length;
          return (
            <div key={s.id} className="flex items-center gap-3">
              <span className="text-xl">{s.emoji}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <b>
                    {s.vi} <span className="font-normal text-muted">({s.level})</span>
                  </b>
                  <span className="text-muted">
                    {done}/{units.length}
                  </span>
                </div>
                <ProgressBar value={done / units.length} tone="good" className="mt-1" />
              </div>
            </div>
          );
        })}
      </Card>

      <SectionTitle>Sao lưu dữ liệu</SectionTitle>
      <Card className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          Tiến độ được lưu trong trình duyệt của máy này. Tải file sao lưu để chuyển sang máy khác hoặc phòng khi xoá dữ
          liệu trình duyệt.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportBackup}>
            ⬇️ Tải file sao lưu
          </Button>
          <Button variant="outline" onClick={() => file.current?.click()}>
            ⬆️ Khôi phục từ file
          </Button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importBackup(f);
              e.target.value = '';
            }}
          />
        </div>
        {msg && (
          <Callout tone="primary" icon="ℹ️">
            {msg}
          </Callout>
        )}
        <button
          className="flex items-center gap-1 self-start text-sm text-bad underline"
          onClick={() => {
            if (confirm('Xoá toàn bộ tiến độ học? Không thể hoàn tác.') && confirm('Chắc chắn xoá hết?')) {
              reset();
              setMsg('Đã xoá tiến độ.');
            }
          }}
        >
          <Icon name="x" size={14} /> Xoá toàn bộ tiến độ
        </button>
      </Card>
    </div>
  );
}

const Legend = ({ c, l }: { c: string; l: string }) => (
  <span className="flex items-center gap-1.5">
    <span className={cx('size-3 rounded-full', c)} />
    {l}
  </span>
);
