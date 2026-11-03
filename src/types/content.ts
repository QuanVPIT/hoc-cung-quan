// Kiểu dữ liệu cho nội dung bài học

export type Level = 'A1' | 'A1+' | 'A2' | 'A2+';
export type StageId = 1 | 2 | 3 | 4;

/** Một câu song ngữ */
export interface Sentence {
  en: string;
  vi: string;
}

export interface Word {
  /** Mã thẻ, duy nhất trong toàn app: `w:u01:hello` */
  id: string;
  unitId: string;
  en: string;
  vi: string;
  ipa: string;
  emoji: string;
  /** Câu ví dụ (luôn chứa đúng từ `en`) */
  ex: Sentence;
}

/** Mẫu câu cốt lõi, kèm giải thích ngắn bằng tiếng Việt */
export interface Pattern {
  id: string;
  unitId: string;
  form: string;
  vi: string;
  note: string;
  examples: (Sentence & { id: string })[];
}

export interface DialogueLine extends Sentence {
  who: 'A' | 'B';
}

export interface Dialogue {
  id: string;
  title: string;
  vi: string;
  a: string;
  b: string;
  lines: DialogueLine[];
}

export interface Unit {
  id: string;
  /** Số thứ tự bài (1..20) */
  no: number;
  stage: StageId;
  level: Level;
  emoji: string;
  title: string;
  vi: string;
  /** Học xong bài này bạn có thể… */
  goal: string;
  words: Word[];
  patterns: Pattern[];
  dialogues: Dialogue[];
  /** Mẹo nhớ / lưu ý văn hoá */
  tip: string;
}

export interface Stage {
  id: StageId;
  title: string;
  vi: string;
  level: string;
  emoji: string;
}
