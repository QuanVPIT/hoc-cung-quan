// Trang một bài học: 4 phần Từ vựng → Mẫu câu → Hội thoại → Luyện tập.
import { useEffect } from 'react';
import { Icon } from '../components/Icon';
import { Callout, Chip, Empty } from '../components/ui';
import { UNITS, unitById } from '../data';
import { DialogueTab } from '../features/dialogue/DialogueTab';
import { PhrasesTab } from '../features/phrases/PhrasesTab';
import { PracticeTab } from '../features/practice/PracticeTab';
import { VocabTab } from '../features/vocab/VocabTab';
import { cx } from '../lib/cx';
import { href, navigate } from '../lib/router';
import { stopSpeaking } from '../lib/tts';
import { unitParts, type UnitPart } from '../store/progress';
import { useStore } from '../store/AppStore';

const TABS: { id: UnitPart; label: string; icon: string }[] = [
  { id: 'vocab', label: 'Từ vựng', icon: '🔤' },
  { id: 'phrases', label: 'Mẫu câu', icon: '🧩' },
  { id: 'dialogue', label: 'Hội thoại', icon: '💬' },
  { id: 'practice', label: 'Luyện tập', icon: '🎯' },
];

export function UnitPage({ unitId, tab }: { unitId: string; tab?: string }) {
  const { state } = useStore();
  const unit = unitById(unitId);
  const active = (TABS.find((t) => t.id === tab)?.id ?? 'vocab') as UnitPart;

  useEffect(() => () => stopSpeaking(), [active]);

  if (!unit)
    return (
      <Empty icon="🤔" title="Không tìm thấy bài học">
        <a className="text-primary underline" href={href('')}>
          Về lộ trình
        </a>
      </Empty>
    );

  const parts = unitParts(state, unit);
  const go = (t: UnitPart) => navigate(`unit/${unit.id}/${t}`);
  const nextUnit = UNITS[unit.no];

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex items-start gap-3">
        <a href={href('')} aria-label="Về lộ trình" className="mt-1 rounded-full p-1.5 text-muted hover:bg-surface-2">
          <Icon name="back" />
        </a>
        <div className="text-4xl">{unit.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted">Bài {unit.no}</span>
            <Chip tone="primary">{unit.level}</Chip>
          </div>
          <h1 className="text-2xl leading-tight font-extrabold">{unit.title}</h1>
          <div className="text-muted">{unit.vi}</div>
        </div>
      </div>
      <Callout tone="primary" icon="🎯">
        <b>Mục tiêu:</b> {unit.goal}
      </Callout>

      <div className="sticky top-14 z-10 -mx-4 bg-bg/90 px-4 py-2 backdrop-blur">
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-surface-2 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              className={cx(
                'relative flex flex-col items-center rounded-xl py-1.5 text-xs font-semibold transition sm:flex-row sm:justify-center sm:gap-1.5 sm:text-sm',
                active === t.id ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
              )}
            >
              <span>{t.icon}</span>
              {t.label}
              {parts[t.id] && <span className="absolute top-1 right-1.5 text-[10px] text-good">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {active === 'vocab' && <VocabTab unit={unit} />}
      {active === 'phrases' && <PhrasesTab unit={unit} onDone={() => go('dialogue')} />}
      {active === 'dialogue' && <DialogueTab unit={unit} onDone={() => go('practice')} />}
      {active === 'practice' && (
        <PracticeTab unit={unit} onNextUnit={nextUnit ? () => navigate(`unit/${nextUnit.id}`) : undefined} />
      )}

      {active === 'vocab' && (
        <Callout>
          <b>Mẹo bài này:</b> {unit.tip}
        </Callout>
      )}
    </div>
  );
}
