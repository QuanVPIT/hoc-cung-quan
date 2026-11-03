// Sổ tay: tra cứu mọi từ và mẫu câu đã có trong app; lọc theo bài, đánh dấu, từ khó.
import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, Card, Chip, Empty, SpeakButton, StarButton } from '../components/ui';
import { ALL_CARD_IDS, cardById, UNITS, type CardRef } from '../data';
import { cx } from '../lib/cx';
import { STATUS_LABEL, statusOf } from '../lib/srs';
import { useStore } from '../store/AppStore';

type Filter = 'all' | 'word' | 'sentence' | 'starred' | 'hard' | 'learned';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'word', label: 'Từ vựng' },
  { id: 'sentence', label: 'Mẫu câu' },
  { id: 'starred', label: '⭐ Đánh dấu' },
  { id: 'learned', label: 'Đã học' },
  { id: 'hard', label: 'Từ khó' },
];

// Bỏ dấu tiếng Việt để tìm "cam on" vẫn ra "cảm ơn"
const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

const REFS = ALL_CARD_IDS.map((id) => cardById(id)!);
const searchText = (r: CardRef) =>
  fold(
    r.kind === 'word'
      ? `${r.word.en} ${r.word.vi} ${r.word.ex.en} ${r.word.ex.vi}`
      : `${r.en} ${r.vi} ${r.pattern.form}`,
  );
const INDEX = new Map(REFS.map((r) => [r.id, searchText(r)]));

const PAGE = 60;

export function NotebookPage() {
  const { state, toggleStar } = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [unit, setUnit] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const results = useMemo(() => {
    const q = fold(query.trim());
    return REFS.filter((r) => {
      if (unit && r.unit.id !== unit) return false;
      if (filter === 'word' && r.kind !== 'word') return false;
      if (filter === 'sentence' && r.kind !== 'sentence') return false;
      if (filter === 'starred' && !state.starred.includes(r.id)) return false;
      if (filter === 'learned' && !state.cards[r.id]) return false;
      if (filter === 'hard' && (state.cards[r.id]?.lapses ?? 0) < 2) return false;
      return !q || INDEX.get(r.id)!.includes(q);
    });
  }, [query, filter, unit, state.starred, state.cards]);

  return (
    <div className="flex flex-col gap-4 pb-6">
      <h1 className="text-2xl font-extrabold">Sổ tay</h1>
      <div className="relative">
        <Icon name="search" className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Tìm tiếng Anh hoặc tiếng Việt…"
          className="w-full rounded-2xl border border-line bg-surface py-3 pr-4 pl-11 outline-none focus:border-primary"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setFilter(f.id);
              setLimit(PAGE);
            }}
            className={cx(
              'rounded-full px-3 py-1.5 text-sm font-semibold transition',
              filter === f.id ? 'bg-primary text-white' : 'bg-surface-2 text-muted hover:text-ink',
            )}
          >
            {f.label}
          </button>
        ))}
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          aria-label="Lọc theo bài"
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm"
        >
          <option value="">Mọi bài</option>
          {UNITS.map((u) => (
            <option key={u.id} value={u.id}>
              Bài {u.no}: {u.vi}
            </option>
          ))}
        </select>
      </div>
      <div className="text-sm text-muted">{results.length} kết quả</div>

      {results.length === 0 ? (
        <Empty icon="🔍" title="Không có kết quả">
          {filter === 'starred' ? 'Bấm ☆ ở từ hoặc câu bất kỳ để lưu vào đây.' : 'Thử từ khóa khác hoặc bỏ bớt bộ lọc.'}
        </Empty>
      ) : (
        <Card className="divide-y divide-line p-0!">
          {results.slice(0, limit).map((r) => {
            const status = statusOf(state.cards[r.id]);
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                {r.kind === 'word' ? (
                  <>
                    <span className="w-9 flex-none text-center text-2xl">{r.word.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <b>{r.word.en}</b>
                        {state.settings.showIpa && <span className="font-mono text-xs text-muted">{r.word.ipa}</span>}
                      </div>
                      <div className="text-sm text-muted">{r.word.vi}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="w-9 flex-none text-center text-xl">🧩</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{r.en}</div>
                      <div className="text-sm text-muted">{r.vi}</div>
                    </div>
                  </>
                )}
                <div className="hidden flex-col items-end gap-1 sm:flex">
                  <Chip>Bài {r.unit.no}</Chip>
                  {status !== 'new' && <span className="text-xs text-muted">{STATUS_LABEL[status]}</span>}
                </div>
                <SpeakButton text={r.kind === 'word' ? r.word.en : r.en} size="sm" />
                <StarButton on={state.starred.includes(r.id)} onClick={() => toggleStar(r.id)} />
              </div>
            );
          })}
        </Card>
      )}
      {results.length > limit && (
        <Button variant="outline" onClick={() => setLimit(limit + PAGE)}>
          Xem thêm ({results.length - limit})
        </Button>
      )}
    </div>
  );
}
