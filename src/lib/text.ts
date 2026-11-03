// So sánh câu người học gõ / nói với câu đúng: bỏ dấu câu, viết hoa, gộp dạng viết tắt.

const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am',
  "you're": 'you are',
  "we're": 'we are',
  "they're": 'they are',
  "he's": 'he is',
  "she's": 'she is',
  "it's": 'it is',
  "that's": 'that is',
  "what's": 'what is',
  "where's": 'where is',
  "who's": 'who is',
  "there's": 'there is',
  "here's": 'here is',
  "let's": 'let us',
  "i'll": 'i will',
  "you'll": 'you will',
  "we'll": 'we will',
  "she'll": 'she will',
  "he'll": 'he will',
  "they'll": 'they will',
  "i'd": 'i would',
  "you'd": 'you would',
  "i've": 'i have',
  "don't": 'do not',
  "doesn't": 'does not',
  "didn't": 'did not',
  "can't": 'cannot',
  "won't": 'will not',
  "isn't": 'is not',
  "aren't": 'are not',
  "wasn't": 'was not',
  "haven't": 'have not',
  "shouldn't": 'should not',
};

const NUMBERS: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  '10': 'ten',
  '11': 'eleven',
  '12': 'twelve',
  '15': 'fifteen',
  '20': 'twenty',
  '30': 'thirty',
  '50': 'fifty',
  '100': 'hundred',
};

/** Chuẩn hoá thành danh sách từ để so sánh */
export function words(s: string): string[] {
  const base = s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9' ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return base.flatMap((w) => (CONTRACTIONS[w] ?? NUMBERS[w] ?? w.replace(/'/g, '')).split(' '));
}

export function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Hai từ coi như khớp: giống hệt, hoặc sai 1 ký tự với từ dài ≥ 5 (lỗi gõ nhẹ) */
const near = (a: string, b: string) => a === b || (Math.min(a.length, b.length) >= 5 && levenshtein(a, b) <= 1);

export interface DiffToken {
  word: string;
  ok: boolean;
}

export interface CompareResult {
  /** Tỉ lệ từ đúng 0..1 */
  score: number;
  /** Đúng hoàn toàn (cho phép lỗi gõ nhẹ) */
  exact: boolean;
  /** Các từ của câu đúng, đánh dấu từ người học có / thiếu */
  target: DiffToken[];
}

/** So khớp theo dãy con chung dài nhất (LCS) để đánh dấu từ đúng/sai theo thứ tự */
export function compare(answer: string, expected: string): CompareResult {
  const a = words(answer);
  const e = words(expected);
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(e.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = e.length - 1; j >= 0; j--)
      dp[i][j] = near(a[i], e[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ok = new Array<boolean>(e.length).fill(false);
  let i = 0;
  let j = 0;
  while (i < a.length && j < e.length) {
    if (near(a[i], e[j])) {
      ok[j] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const matched = ok.filter(Boolean).length;
  const score = e.length ? matched / Math.max(e.length, a.length) : 0;
  return {
    score,
    exact: matched === e.length && a.length === e.length,
    target: e.map((word, k) => ({ word, ok: ok[k] })),
  };
}

/** Tách câu thành các ô chữ (giữ dấu câu dính vào từ) cho bài xếp câu */
export const tokens = (s: string) => s.split(/\s+/).filter(Boolean);
