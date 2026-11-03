// Điều hướng đơn giản bằng dấu # trên URL (chạy tốt trên GitHub Pages, không cần cấu hình máy chủ).
import { useEffect, useState } from 'react';

const read = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);

export function useRoute(): string[] {
  const [path, setPath] = useState(read);
  useEffect(() => {
    const on = () => {
      setPath(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return path;
}

export const href = (path: string) => `#/${path}`;

export function navigate(path: string) {
  window.location.hash = `/${path}`;
}
