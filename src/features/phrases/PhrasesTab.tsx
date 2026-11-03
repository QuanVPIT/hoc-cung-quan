// Phần Mẫu câu: công thức câu + giải thích ngắn bằng tiếng Việt + ví dụ có giọng đọc.
import { Button, Callout, Card, Chip, SpeakButton, StarButton } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import type { Unit } from '../../types/content';

export function PhrasesTab({ unit, onDone }: { unit: Unit; onDone: () => void }) {
  const { state, addCards, toggleStar, markPart } = useStore();
  const allIds = unit.patterns.flatMap((p) => p.examples.map((e) => e.id));
  const done = !!state.units[unit.id]?.parts.phrases;

  return (
    <div className="flex flex-col gap-4">
      {unit.patterns.map((p, i) => {
        const ids = p.examples.map((e) => e.id);
        const added = ids.every((id) => state.cards[id]);
        return (
          <Card key={p.id} className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="flex size-8 flex-none items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="text-lg leading-snug font-bold">{p.form}</div>
                <div className="text-primary">{p.vi}</div>
              </div>
            </div>
            <Callout>{p.note}</Callout>
            <ul className="flex flex-col gap-2">
              {p.examples.map((e) => (
                <li key={e.id} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2">
                  <SpeakButton text={e.en} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{e.en}</div>
                    <div className="text-sm text-muted">{e.vi}</div>
                  </div>
                  <StarButton on={state.starred.includes(e.id)} onClick={() => toggleStar(e.id)} />
                </li>
              ))}
            </ul>
            <div>
              {added ? (
                <Chip tone="good">✓ Đã thêm vào ôn tập</Chip>
              ) : (
                <Button size="sm" variant="soft" icon="plus" onClick={() => addCards(ids)}>
                  Thêm {ids.length} câu vào ôn tập
                </Button>
              )}
            </div>
          </Card>
        );
      })}

      <Card className="flex flex-col items-center gap-2 text-center">
        <div className="text-muted">
          {done ? 'Bạn đã học xong phần mẫu câu.' : 'Đọc to từng ví dụ 2–3 lần, rồi đánh dấu hoàn thành.'}
        </div>
        <Button
          variant={done ? 'soft' : 'primary'}
          icon="check"
          onClick={() => {
            addCards(allIds);
            markPart(unit.id, 'phrases');
            onDone();
          }}
        >
          {done ? 'Sang phần Hội thoại' : 'Đã học xong mẫu câu'}
        </Button>
      </Card>
    </div>
  );
}
