import { describe, expect, it } from 'vitest';
import { MATURE_DAYS, newCard, nextInterval, review, statusOf } from './srs';

describe('ôn tập ngắt quãng', () => {
  const T = 1000;

  it('thẻ mới: Quên → mai ôn, Khó/Nhớ → 1 ngày, Dễ → 4 ngày', () => {
    const c = newCard(T);
    expect([0, 1, 2, 3].map((g) => nextInterval(c, g as 0 | 1 | 2 | 3, T))).toEqual([1, 1, 1, 4]);
  });

  it('nhớ liên tục thì khoảng cách tăng dần và thành "thuộc lâu"', () => {
    let c = newCard(T);
    let day = T;
    const gaps: number[] = [];
    for (let i = 0; i < 5; i++) {
      c = review(c, 2, day);
      gaps.push(c.interval);
      day = c.due;
    }
    expect(gaps).toEqual([1, 3, 8, 20, 50]);
    expect(statusOf(c)).toBe('mature');
    expect(c.interval).toBeGreaterThanOrEqual(MATURE_DAYS);
  });

  it('quên thì quay lại từ đầu, giảm độ dễ, đếm số lần quên', () => {
    let c = review(review(newCard(T), 2, T), 2, T + 1);
    c = review(c, 0, T + 4);
    expect(c).toMatchObject({ reps: 0, interval: 0, lapses: 1, due: T + 5 });
    expect(c.ease).toBeCloseTo(2.3);
    expect(statusOf(c)).toBe('learning');
  });

  it('độ dễ nằm trong khoảng 1.3 → 3', () => {
    let c = newCard(T);
    for (let i = 0; i < 20; i++) c = review(c, 0, T);
    expect(c.ease).toBe(1.3);
    for (let i = 0; i < 20; i++) c = review(c, 3, T);
    expect(c.ease).toBe(3);
  });

  it('trạng thái', () => {
    expect(statusOf(undefined)).toBe('new');
    expect(statusOf(review(newCard(T), 2, T))).toBe('learning');
    expect(statusOf(review(review(newCard(T), 2, T), 2, T + 1))).toBe('young');
  });
});
