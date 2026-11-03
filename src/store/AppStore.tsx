// Kho dữ liệu chung của app: đọc/ghi tiến độ vào máy và cung cấp cho mọi màn hình.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dayNumber } from '../lib/date';
import type { Grade } from '../lib/srs';
import { storage } from '../lib/storage';
import { configureVoice } from '../lib/tts';
import * as P from './progress';

const KEY = 'state';

function load(): P.AppState {
  const saved = storage.get<unknown>(KEY, null);
  return (saved ? P.parseBackup(JSON.stringify(saved)) : null) ?? P.emptyState();
}

function useAppStoreValue() {
  const [state, setState] = useState<P.AppState>(load);
  // Ngày hôm nay (cập nhật khi mở lại app sau nửa đêm)
  const [today, setToday] = useState(dayNumber);

  useEffect(() => storage.set(KEY, state), [state]);
  useEffect(
    () => configureVoice(state.settings.voice, state.settings.rate),
    [state.settings.voice, state.settings.rate],
  );
  useEffect(() => {
    const onFocus = () => setToday(dayNumber());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const grade = useCallback((id: string, g: Grade) => setState((s) => P.gradeCard(s, id, g, dayNumber())), []);
  const addCards = useCallback((ids: string[]) => setState((s) => P.addCards(s, ids, dayNumber())), []);
  const markPart = useCallback((unitId: string, part: P.UnitPart) => setState((s) => P.markPart(s, unitId, part)), []);
  const recordPractice = useCallback(
    (unitId: string, results: P.PracticeResult[]) => setState((s) => P.recordPractice(s, unitId, results, dayNumber())),
    [],
  );
  const toggleStar = useCallback((id: string) => setState((s) => P.toggleStar(s, id)), []);
  const updateSettings = useCallback(
    (patch: Partial<P.Settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    [],
  );
  const replace = useCallback((next: P.AppState) => setState(next), []);
  const reset = useCallback(() => setState((s) => ({ ...P.emptyState(), settings: s.settings })), []);

  return useMemo(
    () => ({ state, today, grade, addCards, markPart, recordPractice, toggleStar, updateSettings, replace, reset }),
    [state, today, grade, addCards, markPart, recordPractice, toggleStar, updateSettings, replace, reset],
  );
}

type Store = ReturnType<typeof useAppStoreValue>;
const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const value = useAppStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore phải nằm trong AppStoreProvider');
  return s;
}
