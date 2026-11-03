import { describe, expect, it } from 'vitest';
import { UNITS } from '../../data';
import { tokens } from '../../lib/text';
import { blankOf, buildPractice, orderCorrect, scramble, usableSentence } from './buildPractice';

describe('bài luyện tập', () => {
  it('mỗi bài tạo đủ 12 câu, đúng các loại, phương án không trùng và có đáp án', () => {
    for (const u of UNITS) {
      for (const canSpeak of [true, false]) {
        const qs = buildPractice(u, { canSpeak });
        expect(qs, u.id).toHaveLength(12);
        const count = (t: string) => qs.filter((q) => q.type === t).length;
        expect(count('speak')).toBe(canSpeak ? 1 : 0);
        expect(count('order')).toBe(canSpeak ? 1 : 2);
        expect(count('dictation')).toBe(2);
        expect(count('fill')).toBe(2);
        for (const q of qs) {
          if ('options' in q) {
            expect(q.options).toHaveLength(4);
            expect(new Set(q.options.map((o) => o.toLowerCase())).size).toBe(4);
            expect(q.options).toContain(q.answer);
          }
        }
        // Không hỏi một từ hai lần
        const ids = qs.filter((q) => 'word' in q).map((q) => q.cardId);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it('mỗi bài có ít nhất 2 từ điền được vào câu ví dụ', () => {
    for (const u of UNITS) expect(u.words.filter((w) => blankOf(w)).length, u.id).toBeGreaterThanOrEqual(2);
  });

  it('bỏ câu có chữ số, đánh vần, quá ngắn hoặc quá dài', () => {
    expect(usableSentence('Nice to meet you, Tom.')).toBe(true);
    expect(usableSentence("I'm a nurse.")).toBe(true);
    expect(usableSentence('Your room is 512.')).toBe(false);
    expect(usableSentence('Q, U, A, N. Quan.')).toBe(false);
    expect(usableSentence('Speaking.')).toBe(false);
  });

  it('xếp câu: xáo khác thứ tự gốc, chấm đúng khi xếp lại', () => {
    const en = "I'm from Da Nang.";
    const t = tokens(en);
    expect(scramble(t).join(' ')).not.toBe(t.join(' '));
    expect(orderCorrect(t, en)).toBe(true);
    expect(orderCorrect([...t].reverse(), en)).toBe(false);
  });
});
