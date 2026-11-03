// Bộ dựng bài học: viết nội dung ở dạng gọn (chuỗi ngăn bởi "|"), rồi chuyển thành dữ liệu đầy đủ.
import type { Dialogue, Level, Pattern, StageId, Unit, Word } from '../types/content';

export interface UnitSource {
  no: number;
  stage: StageId;
  level: Level;
  emoji: string;
  title: string;
  vi: string;
  goal: string;
  /** `en | nghĩa | ipa | emoji | câu ví dụ | dịch câu ví dụ` */
  words: string[];
  patterns: { form: string; vi: string; note: string; ex: string[] }[];
  /** Mỗi dòng: `A: câu tiếng Anh | dịch` */
  dialogues: { title: string; vi: string; a: string; b: string; lines: string[] }[];
  tip: string;
}

const split = (s: string) => s.split('|').map((x) => x.trim());

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const unitIdOf = (no: number) => `u${String(no).padStart(2, '0')}`;

export function unit(src: UnitSource): Unit {
  const id = unitIdOf(src.no);
  const words: Word[] = src.words.map((line) => {
    const [en, vi, ipa, emoji, exEn, exVi] = split(line);
    if (!exVi) throw new Error(`Thiếu trường ở từ: ${line}`);
    return { id: `w:${id}:${slug(en)}`, unitId: id, en, vi, ipa: `/${ipa}/`, emoji, ex: { en: exEn, vi: exVi } };
  });
  const patterns: Pattern[] = src.patterns.map((p, i) => ({
    id: `p:${id}:${i + 1}`,
    unitId: id,
    form: p.form,
    vi: p.vi,
    note: p.note,
    examples: p.ex.map((line, k) => {
      const [en, vi] = split(line);
      if (!vi) throw new Error(`Thiếu bản dịch: ${line}`);
      return { id: `s:${id}:${i + 1}.${k + 1}`, en, vi };
    }),
  }));
  const dialogues: Dialogue[] = src.dialogues.map((d, i) => ({
    id: `d:${id}:${i + 1}`,
    title: d.title,
    vi: d.vi,
    a: d.a,
    b: d.b,
    lines: d.lines.map((line) => {
      const m = /^([AB]):\s*(.*)$/.exec(line);
      if (!m) throw new Error(`Dòng hội thoại phải bắt đầu bằng A: hoặc B: — ${line}`);
      const [en, vi] = split(m[2]);
      if (!vi) throw new Error(`Thiếu bản dịch: ${line}`);
      return { who: m[1] as 'A' | 'B', en, vi };
    }),
  }));
  return { ...src, id, words, patterns, dialogues };
}
