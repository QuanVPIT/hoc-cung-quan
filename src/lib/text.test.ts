import { describe, expect, it } from 'vitest';
import { compare, words } from './text';

describe('so sánh câu', () => {
  it('chuẩn hoá: bỏ dấu câu, viết hoa, gộp viết tắt và số', () => {
    expect(words("I'm fine, thank you!")).toEqual(['i', 'am', 'fine', 'thank', 'you']);
    expect(words('It’s 7 o’clock')).toEqual(['it', 'is', 'seven', 'oclock']);
    expect(words('thirty-two')).toEqual(['thirty', 'two']);
  });

  it('câu đúng (kể cả khác dạng viết tắt / lỗi gõ nhẹ) là chính xác', () => {
    expect(compare('i am fine thank you', "I'm fine, thank you.").exact).toBe(true);
    expect(compare('Wait a minute, pleese', 'Wait a minute, please.').exact).toBe(true);
  });

  it('đánh dấu từ thiếu và chấm điểm theo tỉ lệ', () => {
    const r = compare('I live Hanoi', 'I live in Hanoi.');
    expect(r.exact).toBe(false);
    expect(r.target.map((t) => t.ok)).toEqual([true, true, false, true]);
    expect(r.score).toBeCloseTo(0.75);
  });

  it('thừa từ cũng không tính là chính xác', () => {
    expect(compare('I live in in Hanoi', 'I live in Hanoi').exact).toBe(false);
  });

  it('từ ngắn sai 1 chữ là sai', () => {
    expect(compare('I life in Hanoi', 'I live in Hanoi').exact).toBe(false);
  });
});
