/** Ghép class, bỏ qua giá trị rỗng */
export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');
