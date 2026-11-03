import { describe, expect, it } from 'vitest';
import { ALL_CARD_IDS, ALL_WORDS, STAGES, UNITS, cardById } from '.';

describe('nội dung bài học', () => {
  it('đủ 20 bài, 4 chặng, mỗi chặng 5 bài, số bài liên tục', () => {
    expect(UNITS).toHaveLength(20);
    UNITS.forEach((u, i) => expect(u.no).toBe(i + 1));
    for (const s of STAGES) expect(UNITS.filter((u) => u.stage === s.id)).toHaveLength(5);
  });

  it('mỗi bài: 15 từ, 4 mẫu câu (≥3 ví dụ), 2 hội thoại (≥6 dòng, đủ 2 vai)', () => {
    for (const u of UNITS) {
      expect(u.words, u.id).toHaveLength(15);
      expect(u.patterns, u.id).toHaveLength(4);
      u.patterns.forEach((p) => expect(p.examples.length, `${u.id} ${p.form}`).toBeGreaterThanOrEqual(3));
      expect(u.dialogues, u.id).toHaveLength(2);
      for (const d of u.dialogues) {
        expect(d.lines.length, `${u.id} ${d.title}`).toBeGreaterThanOrEqual(6);
        expect(new Set(d.lines.map((l) => l.who)).size).toBe(2);
      }
      expect(u.tip.length).toBeGreaterThan(10);
    }
  });

  it('không có từ trùng nhau giữa các bài', () => {
    const seen = new Map<string, string>();
    for (const w of ALL_WORDS) {
      const k = w.en.toLowerCase();
      expect(seen.get(k), `"${w.en}" trùng ở ${seen.get(k)} và ${w.unitId}`).toBeUndefined();
      seen.set(k, w.unitId);
    }
  });

  it('câu ví dụ luôn chứa đúng từ đang học', () => {
    for (const w of ALL_WORDS) expect(w.ex.en.toLowerCase(), w.id).toContain(w.en.toLowerCase());
  });

  it('mọi trường đều có nội dung, phiên âm đúng dạng /…/', () => {
    for (const w of ALL_WORDS) {
      for (const v of [w.en, w.vi, w.emoji, w.ex.en, w.ex.vi]) expect(v.trim(), w.id).not.toBe('');
      expect(w.ipa, w.id).toMatch(/^\/[^/\s][^/]*\/$/);
    }
  });

  it('mã thẻ duy nhất và tra cứu được', () => {
    expect(new Set(ALL_CARD_IDS).size).toBe(ALL_CARD_IDS.length);
    expect(ALL_CARD_IDS.length).toBe(
      20 * 15 + UNITS.reduce((n, u) => n + u.patterns.flatMap((p) => p.examples).length, 0),
    );
    expect(cardById('w:u01:hello')?.kind).toBe('word');
    expect(cardById('s:u01:1.1')?.kind).toBe('sentence');
  });
});
