export function shuffle<T>(list: readonly T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

/** Lấy n phần tử ngẫu nhiên khác nhau */
export const sample = <T>(list: readonly T[], n: number): T[] => shuffle(list).slice(0, n);
