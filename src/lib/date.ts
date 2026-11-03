// Ngày tính theo giờ máy, dạng số nguyên (số ngày kể từ 1970-01-01) để cộng trừ dễ dàng.
export const dayNumber = (d: Date = new Date()) =>
  Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);

export const dayKey = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10);

export function formatDays(n: number) {
  if (n <= 0) return 'hôm nay';
  if (n === 1) return '1 ngày';
  if (n < 30) return `${n} ngày`;
  if (n < 365) return `${Math.round(n / 30)} tháng`;
  return `${Math.round((n / 365) * 10) / 10} năm`;
}
