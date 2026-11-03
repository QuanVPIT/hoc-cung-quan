// Ôn tập ngắt quãng (kiểu Anki, giản lược từ thuật toán SM-2).
// Mỗi lần ôn, bạn tự chấm: Quên / Khó / Nhớ / Dễ. Nhớ càng tốt, lần ôn sau càng cách xa.

export type Grade = 0 | 1 | 2 | 3; // 0 Quên, 1 Khó, 2 Nhớ, 3 Dễ

export interface CardState {
  /** Ngày cần ôn tiếp (dayNumber) */
  due: number;
  /** Khoảng cách hiện tại, tính bằng ngày */
  interval: number;
  /** Hệ số dễ nhớ, 1.3 → 3.0 */
  ease: number;
  /** Số lần nhớ liên tiếp */
  reps: number;
  lapses: number;
  /** Lần ôn gần nhất (dayNumber) */
  last: number;
}

export const GRADES: { grade: Grade; label: string; key: string }[] = [
  { grade: 0, label: 'Quên', key: '1' },
  { grade: 1, label: 'Khó', key: '2' },
  { grade: 2, label: 'Nhớ', key: '3' },
  { grade: 3, label: 'Dễ', key: '4' },
];

/** Thuộc lâu: đã nhớ được ít nhất 21 ngày */
export const MATURE_DAYS = 21;

export function newCard(today: number): CardState {
  return { due: today, interval: 0, ease: 2.5, reps: 0, lapses: 0, last: today };
}

/** Tính trạng thái mới sau khi chấm điểm một thẻ */
export function review(card: CardState, grade: Grade, today: number): CardState {
  let { interval, ease, reps, lapses } = card;
  if (grade === 0) {
    reps = 0;
    lapses += 1;
    interval = 0; // ôn lại ngay trong buổi này và ngày mai
    ease = Math.max(1.3, ease - 0.2);
  } else if (grade === 1) {
    interval = reps === 0 ? 1 : Math.max(interval + 1, Math.round(interval * 1.2));
    ease = Math.max(1.3, ease - 0.15);
    reps += 1;
  } else if (grade === 2) {
    interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.max(interval + 1, Math.round(interval * ease));
    reps += 1;
  } else {
    interval = reps === 0 ? 4 : Math.max(interval + 2, Math.round(interval * ease * 1.3));
    ease = Math.min(3, ease + 0.15);
    reps += 1;
  }
  return { due: today + (grade === 0 ? 1 : interval), interval, ease: round2(ease), reps, lapses, last: today };
}

/** Xem trước: nếu chấm `grade` thì bao nhiêu ngày nữa ôn lại */
export const nextInterval = (card: CardState, grade: Grade, today: number) => review(card, grade, today).due - today;

const round2 = (n: number) => Math.round(n * 100) / 100;

export type CardStatus = 'new' | 'learning' | 'young' | 'mature';

export function statusOf(card: CardState | undefined): CardStatus {
  if (!card) return 'new';
  if (card.interval >= MATURE_DAYS) return 'mature';
  if (card.reps >= 2) return 'young';
  return 'learning';
}

export const STATUS_LABEL: Record<CardStatus, string> = {
  new: 'Chưa học',
  learning: 'Đang học',
  young: 'Đã nhớ',
  mature: 'Thuộc lâu',
};
