// Toàn bộ nội dung: 4 chặng, 20 bài. Thêm bài mới: tạo file trong units/ rồi thêm vào UNITS.
import type { Pattern, Stage, Unit, Word } from '../types/content';
import u01 from './units/u01-hello';
import u02 from './units/u02-numbers-time';
import u03 from './units/u03-family';
import u04 from './units/u04-jobs';
import u05 from './units/u05-daily-routine';
import u06 from './units/u06-food';
import u07 from './units/u07-shopping';
import u08 from './units/u08-directions';
import u09 from './units/u09-transport';
import u10 from './units/u10-weather';
import u11 from './units/u11-making-plans';
import u12 from './units/u12-phone';
import u13 from './units/u13-hotel';
import u14 from './units/u14-health';
import u15 from './units/u15-hobbies';
import u16 from './units/u16-past';
import u17 from './units/u17-future';
import u18 from './units/u18-comparing';
import u19 from './units/u19-at-work';
import u20 from './units/u20-travel';

export const STAGES: Stage[] = [
  { id: 1, title: 'Warm-up', vi: 'Khởi động', level: 'A1', emoji: '🌱' },
  { id: 2, title: 'Everyday life', vi: 'Đời sống', level: 'A1+', emoji: '🏙️' },
  { id: 3, title: 'Conversation', vi: 'Giao tiếp', level: 'A2', emoji: '💬' },
  { id: 4, title: 'Confidence', vi: 'Tự tin', level: 'A2+', emoji: '🚀' },
];

export const UNITS: Unit[] = [
  u01,
  u02,
  u03,
  u04,
  u05,
  u06,
  u07,
  u08,
  u09,
  u10,
  u11,
  u12,
  u13,
  u14,
  u15,
  u16,
  u17,
  u18,
  u19,
  u20,
];

export const ALL_WORDS: Word[] = UNITS.flatMap((u) => u.words);
export const ALL_PATTERNS: Pattern[] = UNITS.flatMap((u) => u.patterns);

export const unitById = (id: string) => UNITS.find((u) => u.id === id);

/** Một thẻ ôn tập: từ vựng hoặc câu mẫu */
export type CardRef =
  | { kind: 'word'; id: string; unit: Unit; word: Word }
  | { kind: 'sentence'; id: string; unit: Unit; pattern: Pattern; en: string; vi: string };

const CARDS = new Map<string, CardRef>();
for (const unit of UNITS) {
  for (const word of unit.words) CARDS.set(word.id, { kind: 'word', id: word.id, unit, word });
  for (const pattern of unit.patterns)
    for (const s of pattern.examples)
      CARDS.set(s.id, { kind: 'sentence', id: s.id, unit, pattern, en: s.en, vi: s.vi });
}

export const cardById = (id: string) => CARDS.get(id);
export const ALL_CARD_IDS = [...CARDS.keys()];
