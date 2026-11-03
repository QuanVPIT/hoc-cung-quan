// Đọc tiếng Anh bằng giọng có sẵn của trình duyệt (Web Speech API).
// Tự chọn giọng tiếng Anh nghe tự nhiên nhất trên máy; người học có thể đổi trong Cài đặt.

const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

export const canSpeak = () => !!synth;

let chosenURI: string | null = null;
let baseRate = 0.9;

// Giọng được ưu tiên (tên chứa các từ này nghe tự nhiên hơn)
const GOOD_NAMES = [
  'premium',
  'enhanced',
  'natural',
  'neural',
  'online',
  'google us english',
  'google uk english female',
  'samantha',
  'ava',
  'allison',
  'susan',
  'zoe',
  'aria',
  'jenny',
  'guy',
  'daniel',
  'karen',
  'moira',
];
// Giọng "vui" của macOS, không hợp để học
const NOVELTY =
  /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|pipe|grandma|grandpa|rocko|shelley|flo|eddy|reed|sandy/i;

export function englishVoices(): SpeechSynthesisVoice[] {
  if (!synth) return [];
  return synth
    .getVoices()
    .filter((v) => /^en[-_]/i.test(v.lang) && !NOVELTY.test(v.name))
    .sort((a, b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name));
}

function voiceScore(v: SpeechSynthesisVoice) {
  const name = v.name.toLowerCase();
  let s = 0;
  GOOD_NAMES.forEach((g, i) => {
    if (name.includes(g)) s += 50 - i;
  });
  if (/en[-_]us/i.test(v.lang)) s += 8;
  else if (/en[-_]gb/i.test(v.lang)) s += 6;
  if (v.localService) s += 2;
  return s;
}

export function currentVoice(): SpeechSynthesisVoice | undefined {
  const list = englishVoices();
  return list.find((v) => v.voiceURI === chosenURI) ?? list[0];
}

export function configureVoice(uri: string | null, rate: number) {
  chosenURI = uri;
  baseRate = rate;
}

/** Gọi lại khi danh sách giọng thay đổi (trình duyệt nạp giọng không đồng bộ) */
export function onVoicesChanged(cb: () => void) {
  if (!synth) return () => {};
  synth.addEventListener('voiceschanged', cb);
  return () => synth.removeEventListener('voiceschanged', cb);
}

let gen = 0;

/** Đọc một câu. Trả về Promise xong khi đọc xong (hoặc bị ngắt). */
export function speak(text: string, opts: { slow?: boolean; rate?: number } = {}): Promise<void> {
  if (!synth) return Promise.resolve();
  const my = ++gen;
  const busy = synth.speaking || synth.pending;
  if (busy) synth.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const v = currentVoice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? 'en-US';
    u.rate = (opts.rate ?? baseRate) * (opts.slow ? 0.65 : 1);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    // Một số trình duyệt không báo onend: tự kết thúc sau thời gian ước lượng
    const guard = setTimeout(finish, 1500 + (text.length * 90) / u.rate);
    // Đang đọc dở thì chờ một nhịp sau cancel (Chrome/Safari hay bỏ qua lệnh speak ngay sau cancel).
    // Không có gì đang đọc thì đọc ngay, để iPhone vẫn tính là do người dùng bấm.
    if (busy) setTimeout(() => my === gen && synth.speak(u), 60);
    else synth.speak(u);
  });
}

export function stopSpeaking() {
  gen++;
  synth?.cancel();
}
