// Chế độ tập trung: phủ toàn màn hình khi đang học thẻ, nhập vai hay làm bài, ẩn mọi thứ khác.
import { useEffect, type ReactNode } from 'react';

export function Focus({ children }: { children: ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-bg">
      <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}
