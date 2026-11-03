// Luyện nói: nghe giọng người học bằng nhận diện giọng nói của trình duyệt rồi chấm điểm.
import { compare, type CompareResult } from './text';
import { stopSpeaking } from './tts';

// Kiểu tối giản cho Web Speech API (TypeScript chưa có sẵn)
interface RecAlt {
  transcript: string;
}
interface RecResult {
  isFinal: boolean;
  length: number;
  [i: number]: RecAlt;
}
interface RecEvent {
  results: { length: number; [i: number]: RecResult };
}
interface Recognizer {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: RecEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognizerCtor = new () => Recognizer;

const SR: RecognizerCtor | null =
  typeof window !== 'undefined'
    ? ((window as unknown as { SpeechRecognition?: RecognizerCtor }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: RecognizerCtor }).webkitSpeechRecognition ??
      null)
    : null;

export const canRecognize = () => !!SR;

export const ERROR_TEXT: Record<string, string> = {
  'no-speech': 'Chưa nghe thấy gì. Bạn nói to và gần micro hơn nhé.',
  'audio-capture': 'Không tìm thấy micro trên máy này.',
  'not-allowed': 'Chưa cho phép dùng micro. Bấm "Cho phép" khi trình duyệt hỏi.',
  'service-not-allowed':
    'Máy chưa bật nhận diện giọng nói. Trên iPhone/iPad: Cài đặt → Cài đặt chung → Bàn phím → bật Đọc chính tả.',
  network: 'Nhận diện giọng nói cần có mạng internet.',
  'language-not-supported': 'Trình duyệt chưa hỗ trợ nghe tiếng Anh.',
  aborted: 'Đã dừng nghe.',
  failed: 'Micro đang bận, bạn thử lại nhé.',
};

export interface ListenResult {
  heard: string[];
  error?: string;
}

export interface ListenSession {
  done: Promise<ListenResult>;
  stop: () => void;
}

/** Bắt đầu nghe. `onLive` nhận chữ máy nghe được trong lúc đang nói. */
export function listen({
  onLive,
  maxMs = 10000,
}: { onLive?: (t: string) => void; maxMs?: number } = {}): ListenSession | null {
  if (!SR) return null;
  stopSpeaking();
  const rec = new SR();
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.maxAlternatives = 5;
  rec.continuous = false;

  let finals: string[] = [];
  let live = '';
  let settled = false;
  let resolveFn: (r: ListenResult) => void = () => {};
  const done = new Promise<ListenResult>((r) => (resolveFn = r));
  const finish = (extra: { error?: string } = {}) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    resolveFn({ heard: finals.length ? finals : live ? [live] : [], ...extra });
  };

  rec.onresult = (e) => {
    let text = '';
    for (let i = 0; i < e.results.length; i++) {
      const res = e.results[i];
      text += res[0].transcript;
      if (res.isFinal) finals = Array.from({ length: res.length }, (_, k) => res[k].transcript);
    }
    live = text.trim();
    onLive?.(live);
  };
  rec.onerror = (e) => {
    if (e.error === 'no-speech' && live) return finish();
    finish({ error: e.error });
  };
  rec.onend = () => finish();

  const timer = setTimeout(() => {
    try {
      rec.stop();
    } catch {
      /* đã dừng */
    }
    setTimeout(() => finish(), 800);
  }, maxMs);

  try {
    rec.start();
  } catch {
    finish({ error: 'failed' });
  }

  return {
    done,
    stop: () => {
      try {
        rec.stop();
      } catch {
        /* đã dừng */
      }
    },
  };
}

/** Chấm phát âm: lấy kết quả tốt nhất trong các phương án máy nghe được */
export function scoreSpeech(heard: string[], target: string): CompareResult & { heard: string } {
  let best = { ...compare('', target), heard: '' };
  for (const h of heard) {
    const r = compare(h, target);
    if (r.score > best.score) best = { ...r, heard: h };
  }
  return best;
}

/** Ngưỡng đạt khi nói */
export const SPEAK_PASS = 0.75;
