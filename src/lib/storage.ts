// Lưu dữ liệu trên máy (localStorage). Chế độ ẩn danh hoặc bị chặn thì bỏ qua, app vẫn chạy.
const PREFIX = 'hcq.';

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v == null ? fallback : (JSON.parse(v) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* bỏ qua */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      /* bỏ qua */
    }
  },
};
