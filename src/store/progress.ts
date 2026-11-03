// Tiến độ học: thẻ ôn tập, bài đã học, ngày học, đánh dấu, cài đặt.
// Toàn bộ là hàm thuần (không đụng tới localStorage) để dễ kiểm thử.
import { cardById, UNITS } from '../data';
import { dayKey } from '../lib/date';
import { newCard, review, statusOf, type CardState, type Grade } from '../lib/srs';
import type { Unit } from '../types/content';

export type UnitPart = 'vocab' | 'phrases' | 'dialogue' | 'practice';
export const UNIT_PARTS: UnitPart[] = ['vocab', 'phrases', 'dialogue', 'practice'];

export interface Settings {
  /** voiceURI của giọng đọc tiếng Anh; null = tự chọn */
  voice: string | null;
  rate: number;
  /** Tự đọc từ khi lật thẻ / mở câu */
  autoPlay: boolean;
  showIpa: boolean;
  /** Số thẻ tối đa mỗi buổi ôn */
  sessionSize: number;
}

export interface UnitProgress {
  parts: Partial<Record<UnitPart, true>>;
  /** Điểm luyện tập cao nhất, 0..100 */
  best: number;
}

export interface AppState {
  v: 1;
  cards: Record<string, CardState>;
  units: Record<string, UnitProgress>;
  /** Số lượt học theo ngày: { '2026-11-03': 25 } */
  activity: Record<string, number>;
  starred: string[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = { voice: null, rate: 0.9, autoPlay: true, showIpa: true, sessionSize: 30 };

export const emptyState = (): AppState => ({
  v: 1,
  cards: {},
  units: {},
  activity: {},
  starred: [],
  settings: { ...DEFAULT_SETTINGS },
});

/** Điểm luyện tập tối thiểu để tính là xong bài */
export const PASS_SCORE = 80;

const bump = (activity: AppState['activity'], today: number, n = 1) => {
  const k = dayKey(today);
  return { ...activity, [k]: (activity[k] ?? 0) + n };
};

/** Chấm một thẻ (thẻ chưa có sẽ được thêm vào ôn tập) */
export function gradeCard(s: AppState, id: string, grade: Grade, today: number): AppState {
  const card = s.cards[id] ?? newCard(today);
  return { ...s, cards: { ...s.cards, [id]: review(card, grade, today) }, activity: bump(s.activity, today) };
}

/** Thêm thẻ vào ôn tập (cần ôn ngay hôm nay). Thẻ đã có thì giữ nguyên. */
export function addCards(s: AppState, ids: string[], today: number): AppState {
  const fresh = ids.filter((id) => !s.cards[id]);
  if (!fresh.length) return s;
  const cards = { ...s.cards };
  for (const id of fresh) cards[id] = newCard(today);
  return { ...s, cards };
}

export function markPart(s: AppState, unitId: string, part: UnitPart): AppState {
  const u = s.units[unitId] ?? { parts: {}, best: 0 };
  if (u.parts[part]) return s;
  return { ...s, units: { ...s.units, [unitId]: { ...u, parts: { ...u.parts, [part]: true } } } };
}

export interface PracticeResult {
  cardId?: string;
  correct: boolean;
}

/** Ghi nhận một lượt luyện tập: lưu điểm cao nhất; câu sai được đưa vào ôn lại sớm */
export function recordPractice(s: AppState, unitId: string, results: PracticeResult[], today: number): AppState {
  const total = results.length;
  const score = total ? Math.round((results.filter((r) => r.correct).length / total) * 100) : 0;
  const u = s.units[unitId] ?? { parts: {}, best: 0 };
  const parts = score >= PASS_SCORE ? { ...u.parts, practice: true as const } : u.parts;
  const cards = { ...s.cards };
  for (const r of results) {
    if (!r.cardId || !cardById(r.cardId)) continue;
    const cur = cards[r.cardId];
    if (!r.correct) cards[r.cardId] = review(cur ?? newCard(today), 0, today);
    else if (!cur) cards[r.cardId] = newCard(today);
  }
  return {
    ...s,
    cards,
    units: { ...s.units, [unitId]: { parts, best: Math.max(u.best, score) } },
    activity: bump(s.activity, today, total),
  };
}

export function toggleStar(s: AppState, id: string): AppState {
  const starred = s.starred.includes(id) ? s.starred.filter((x) => x !== id) : [...s.starred, id];
  return { ...s, starred };
}

// ---------- Tính toán để hiển thị ----------

/** Các thẻ đến hạn ôn (cũ trước), tối đa `limit` */
export function dueCards(s: AppState, today: number, limit = Infinity): string[] {
  return Object.entries(s.cards)
    .filter(([id, c]) => c.due <= today && cardById(id))
    .sort((a, b) => a[1].due - b[1].due || a[1].interval - b[1].interval)
    .slice(0, limit)
    .map(([id]) => id);
}

/** Thẻ sắp đến hạn nhất (để ôn sớm khi hôm nay đã hết bài) */
export function upcomingCards(s: AppState, today: number, limit: number): string[] {
  return Object.entries(s.cards)
    .filter(([id, c]) => c.due > today && cardById(id))
    .sort((a, b) => a[1].due - b[1].due)
    .slice(0, limit)
    .map(([id]) => id);
}

/** Chuỗi ngày học liên tiếp (tính đến hôm nay, hoặc hôm qua nếu hôm nay chưa học) */
export function streak(activity: AppState['activity'], today: number): number {
  let d = activity[dayKey(today)] ? today : today - 1;
  let n = 0;
  while (activity[dayKey(d)]) {
    n++;
    d--;
  }
  return n;
}

export function unitParts(s: AppState, unit: Unit): Record<UnitPart, boolean> {
  const p = s.units[unit.id]?.parts ?? {};
  return {
    vocab: !!p.vocab || unit.words.every((w) => s.cards[w.id]),
    phrases: !!p.phrases,
    dialogue: !!p.dialogue,
    practice: !!p.practice,
  };
}

export const unitDone = (s: AppState, unit: Unit) => Object.values(unitParts(s, unit)).every(Boolean);

/** Bài nên học tiếp: bài đầu tiên chưa xong */
export const nextUnit = (s: AppState) => UNITS.find((u) => !unitDone(s, u)) ?? UNITS[UNITS.length - 1];

export function cardStats(s: AppState) {
  const out = { new: 0, learning: 0, young: 0, mature: 0 };
  for (const id of Object.keys(s.cards)) out[statusOf(s.cards[id])]++;
  return out;
}

// ---------- Sao lưu ----------

export function parseBackup(text: string): AppState | null {
  try {
    const data = JSON.parse(text) as Partial<AppState>;
    if (data.v !== 1 || typeof data.cards !== 'object' || typeof data.units !== 'object') return null;
    return {
      ...emptyState(),
      ...data,
      starred: Array.isArray(data.starred) ? data.starred : [],
      activity: data.activity ?? {},
      settings: { ...DEFAULT_SETTINGS, ...data.settings },
    } as AppState;
  } catch {
    return null;
  }
}
