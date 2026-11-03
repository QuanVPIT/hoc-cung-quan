import { describe, expect, it } from 'vitest';
import { UNITS } from '../data';
import { dayKey } from '../lib/date';
import * as P from './progress';

const T = 20000;

describe('tiến độ', () => {
  it('chấm thẻ: thêm thẻ mới, đếm lượt học trong ngày', () => {
    let s = P.gradeCard(P.emptyState(), 'w:u01:hello', 2, T);
    s = P.gradeCard(s, 'w:u01:name', 0, T);
    expect(s.cards['w:u01:hello'].due).toBe(T + 1);
    expect(s.activity[dayKey(T)]).toBe(2);
  });

  it('thêm vào ôn tập: đến hạn hôm nay, không ghi đè thẻ đã có', () => {
    let s = P.gradeCard(P.emptyState(), 'w:u01:hello', 3, T);
    s = P.addCards(s, ['w:u01:hello', 'w:u01:name'], T);
    expect(s.cards['w:u01:hello'].interval).toBe(4);
    expect(P.dueCards(s, T)).toEqual(['w:u01:name']);
    expect(P.dueCards(s, T + 4)).toHaveLength(2);
  });

  it('chuỗi ngày học', () => {
    const a = { [dayKey(T - 2)]: 3, [dayKey(T - 1)]: 1, [dayKey(T)]: 5 };
    expect(P.streak(a, T)).toBe(3);
    expect(P.streak({ [dayKey(T - 1)]: 1 }, T)).toBe(1); // hôm nay chưa học vẫn giữ chuỗi
    expect(P.streak({ [dayKey(T - 2)]: 1 }, T)).toBe(0);
  });

  it('luyện tập: lưu điểm cao nhất, đạt ≥80% là xong phần luyện tập, câu sai vào ôn lại', () => {
    const r = (n: number, ok: number) =>
      Array.from({ length: n }, (_, i) => ({
        cardId: `w:u01:${['hello', 'name', 'meet', 'from', 'live'][i % 5]}`,
        correct: i < ok,
      }));
    let s = P.recordPractice(P.emptyState(), 'u01', r(10, 6), T);
    expect(s.units.u01).toEqual({ parts: {}, best: 60 });
    expect(P.dueCards(s, T + 1).length).toBeGreaterThan(0);
    s = P.recordPractice(s, 'u01', r(10, 9), T);
    expect(s.units.u01.best).toBe(90);
    expect(s.units.u01.parts.practice).toBe(true);
    s = P.recordPractice(s, 'u01', r(10, 2), T);
    expect(s.units.u01.best).toBe(90);
  });

  it('tiến độ bài: phần từ vựng tự xong khi đã thêm hết từ', () => {
    const u = UNITS[0];
    let s = P.addCards(
      P.emptyState(),
      u.words.map((w) => w.id),
      T,
    );
    expect(P.unitParts(s, u).vocab).toBe(true);
    expect(P.unitDone(s, u)).toBe(false);
    for (const part of ['phrases', 'dialogue', 'practice'] as const) s = P.markPart(s, u.id, part);
    expect(P.unitDone(s, u)).toBe(true);
    expect(P.nextUnit(s).id).toBe('u02');
  });

  it('đánh dấu / bỏ đánh dấu', () => {
    const s = P.toggleStar(P.emptyState(), 'w:u01:hello');
    expect(s.starred).toEqual(['w:u01:hello']);
    expect(P.toggleStar(s, 'w:u01:hello').starred).toEqual([]);
  });

  it('sao lưu: đọc lại được, từ chối file sai', () => {
    const s = P.gradeCard(P.emptyState(), 'w:u01:hello', 2, T);
    expect(P.parseBackup(JSON.stringify(s))).toEqual(s);
    expect(P.parseBackup('{"hello":1}')).toBeNull();
    expect(P.parseBackup('không phải json')).toBeNull();
  });
});
