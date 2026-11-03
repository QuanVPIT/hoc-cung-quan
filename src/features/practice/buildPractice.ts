// Tạo bộ câu luyện tập cho một bài: trắc nghiệm, điền từ, nghe chép, xếp câu, nói.
import { ALL_WORDS } from '../../data';
import { pick, sample, shuffle } from '../../lib/random';
import { tokens, words } from '../../lib/text';
import type { Unit, Word } from '../../types/content';

export type Question =
  | {
      type: 'meaning' | 'reverse' | 'listen';
      cardId: string;
      word: Word;
      options: string[];
      answer: string;
    }
  | { type: 'fill'; cardId: string; word: Word; before: string; after: string; options: string[]; answer: string }
  | { type: 'dictation'; cardId?: string; en: string; vi: string }
  | { type: 'order'; cardId?: string; en: string; vi: string; tiles: string[] }
  | { type: 'speak'; cardId?: string; en: string; vi: string };

export type QuestionType = Question['type'];

export const TYPE_LABEL: Record<QuestionType, string> = {
  meaning: 'Chọn nghĩa đúng',
  reverse: 'Chọn từ tiếng Anh',
  listen: 'Nghe và chọn từ',
  fill: 'Điền từ vào chỗ trống',
  dictation: 'Nghe và chép lại',
  order: 'Sắp xếp thành câu',
  speak: 'Đọc to câu này',
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Tách câu ví dụ quanh từ cần điền; null nếu từ không đứng riêng trong câu */
export function blankOf(word: Word): { before: string; after: string } | null {
  const m = new RegExp(`\\b${escapeRe(word.en)}\\b`, 'i').exec(word.ex.en);
  if (!m) return null;
  return { before: word.ex.en.slice(0, m.index), after: word.ex.en.slice(m.index + m[0].length) };
}

/** Lấy 3 phương án nhiễu khác nhau (ưu tiên cùng bài) theo trường `key` */
function distractors(word: Word, pool: Word[], key: 'en' | 'vi', n = 3): string[] {
  const seen = new Set([word[key].toLowerCase()]);
  const out: string[] = [];
  for (const w of [...shuffle(pool), ...shuffle(ALL_WORDS)]) {
    const v = w[key];
    if (seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
    if (out.length === n) break;
  }
  return out;
}

const choice = (type: 'meaning' | 'reverse' | 'listen', word: Word, pool: Word[]): Question => {
  const key = type === 'meaning' ? 'vi' : 'en';
  return {
    type,
    cardId: word.id,
    word,
    answer: word[key],
    options: shuffle([word[key], ...distractors(word, pool, key)]),
  };
};

const sentenceLen = (en: string) => words(en).length;

/** Câu dùng được cho nghe chép / xếp câu / nói: dài vừa phải, không có chữ số hay đánh vần từng chữ cái */
export const usableSentence = (en: string) => {
  const n = sentenceLen(en);
  return n >= 3 && n <= 10 && !/\d/.test(en) && !words(en).some((w) => w.length === 1 && w !== 'a' && w !== 'i');
};

/**
 * 12 câu: 2 nghĩa, 2 chọn từ, 2 nghe, 2 điền từ, 2 nghe chép, 1 xếp câu, 1 nói
 * (máy không nghe được giọng nói thì thay câu nói bằng xếp câu).
 */
export function buildPractice(unit: Unit, opts: { canSpeak: boolean }): Question[] {
  const ws = sample(unit.words, unit.words.length);
  const fillable = ws.filter((w) => blankOf(w));
  const take = (n: number, from: Word[] = ws) => {
    const out = from.filter((w) => !used.has(w.id)).slice(0, n);
    out.forEach((w) => used.add(w.id));
    return out;
  };
  const used = new Set<string>();

  const qs: Question[] = [];
  for (const w of take(2, fillable)) {
    const b = blankOf(w)!;
    qs.push({
      type: 'fill',
      cardId: w.id,
      word: w,
      ...b,
      answer: w.en,
      options: shuffle([w.en, ...distractors(w, unit.words, 'en')]),
    });
  }
  take(2).forEach((w) => qs.push(choice('meaning', w, unit.words)));
  take(2).forEach((w) => qs.push(choice('reverse', w, unit.words)));
  take(2).forEach((w) => qs.push(choice('listen', w, unit.words)));

  // Câu cho nghe chép / xếp câu / nói: câu mẫu và câu hội thoại có độ dài vừa phải
  const sentences = shuffle([
    ...unit.patterns.flatMap((p) =>
      p.examples.map((s) => ({ cardId: s.id as string | undefined, en: s.en, vi: s.vi })),
    ),
    ...unit.dialogues.flatMap((d) => d.lines.map((l) => ({ cardId: undefined, en: l.en, vi: l.vi }))),
  ]).filter((s) => usableSentence(s.en));
  const takeSentence = (min: number, max: number) => {
    const i = sentences.findIndex((s) => {
      const n = tokens(s.en).length;
      return n >= min && n <= max;
    });
    return i < 0 ? sentences.shift() : sentences.splice(i, 1)[0];
  };

  for (let k = 0; k < 2; k++) {
    const s = takeSentence(3, 9);
    if (s) qs.push({ type: 'dictation', ...s });
  }
  const orderCount = opts.canSpeak ? 1 : 2;
  for (let k = 0; k < orderCount; k++) {
    const s = takeSentence(4, 9);
    if (s) qs.push({ type: 'order', ...s, tiles: scramble(tokens(s.en)) });
  }
  if (opts.canSpeak) {
    const s = takeSentence(3, 8);
    if (s) qs.push({ type: 'speak', ...s });
  }

  // Trộn nhưng giữ câu dễ (chọn) trước, câu khó (chép, xếp, nói) sau
  const easy = shuffle(qs.filter((q) => ['meaning', 'reverse', 'listen', 'fill'].includes(q.type)));
  const hard = shuffle(qs.filter((q) => !['meaning', 'reverse', 'listen', 'fill'].includes(q.type)));
  return [...easy, ...hard];
}

/** Xáo các ô chữ sao cho không trùng thứ tự đúng */
export function scramble(list: string[]): string[] {
  if (list.length < 2) return list;
  for (let i = 0; i < 10; i++) {
    const s = shuffle(list);
    if (s.join(' ') !== list.join(' ')) return s;
  }
  return [...list.slice(1), list[0]];
}

/** Kiểm tra bài xếp câu: so theo từ (bỏ dấu câu, viết hoa) */
export const orderCorrect = (picked: string[], en: string) => words(picked.join(' ')).join(' ') === words(en).join(' ');

export const randomPraise = () =>
  pick(['Chính xác! 🎉', 'Tuyệt vời! 👏', 'Đúng rồi! ✨', 'Giỏi quá! 💪', 'Quá chuẩn! 🌟']);
