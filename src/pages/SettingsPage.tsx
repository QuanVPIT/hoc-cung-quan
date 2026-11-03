// Cài đặt: giọng đọc, tốc độ, tự đọc, phiên âm, số thẻ mỗi buổi ôn.
import { useEffect, useState } from 'react';
import { Button, Callout, Card, SectionTitle, Toggle } from '../components/ui';
import { cx } from '../lib/cx';
import { canSpeak, currentVoice, englishVoices, onVoicesChanged, speak } from '../lib/tts';
import { useStore } from '../store/AppStore';

const SAMPLE = "Hi, I'm learning English. Nice to meet you!";

export function SettingsPage() {
  const { state, updateSettings } = useStore();
  const s = state.settings;
  const [voices, setVoices] = useState(englishVoices);

  useEffect(() => onVoicesChanged(() => setVoices(englishVoices())), []);
  const active = currentVoice();

  return (
    <div className="flex flex-col gap-2 pb-6">
      <h1 className="text-2xl font-extrabold">Cài đặt</h1>

      <SectionTitle>Giọng đọc</SectionTitle>
      <Card className="flex flex-col gap-4">
        {!canSpeak() ? (
          <p className="text-bad">Trình duyệt này không hỗ trợ đọc văn bản. Hãy dùng Chrome, Safari hoặc Edge.</p>
        ) : (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="font-medium">Giọng tiếng Anh</span>
              <select
                value={s.voice ?? ''}
                onChange={(e) => updateSettings({ voice: e.target.value || null })}
                className="rounded-xl border border-line bg-surface px-3 py-2.5"
              >
                <option value="">Tự chọn giọng hay nhất{active && !s.voice ? ` (${active.name})` : ''}</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} — {v.lang}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="flex justify-between font-medium">
                Tốc độ đọc <span className="text-muted tabular-nums">{s.rate.toFixed(2)}×</span>
              </span>
              <input
                type="range"
                min={0.6}
                max={1.2}
                step={0.05}
                value={s.rate}
                onChange={(e) => updateSettings({ rate: Number(e.target.value) })}
                className="accent-primary"
              />
            </label>
            <Button variant="soft" icon="volume" className="self-start" onClick={() => speak(SAMPLE)}>
              Nghe thử
            </Button>
            <Callout icon="🎧">
              Muốn giọng tự nhiên hơn? Trên Mac/iPhone:{' '}
              <b>Settings → Accessibility → Spoken Content → System Voice → Manage Voices</b>, tải giọng tiếng Anh loại{' '}
              <b>Premium/Enhanced</b> (ví dụ Ava, Zoe), rồi tải lại trang. Trên Windows dùng Edge để có giọng "Online
              (Natural)".
            </Callout>
          </>
        )}
      </Card>

      <SectionTitle>Học tập</SectionTitle>
      <Card className="flex flex-col divide-y divide-line py-1!">
        <Toggle
          checked={s.autoPlay}
          onChange={(v) => updateSettings({ autoPlay: v })}
          label="Tự đọc khi mở thẻ"
          hint="Nghe phát âm ngay khi thẻ hiện ra"
        />
        <Toggle
          checked={s.showIpa}
          onChange={(v) => updateSettings({ showIpa: v })}
          label="Hiện phiên âm IPA"
          hint="Ví dụ: hello /həˈloʊ/"
        />
        <div className="flex flex-col gap-2 py-3">
          <span className="font-medium">Số thẻ mỗi buổi ôn</span>
          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 50, 100].map((n) => (
              <button
                key={n}
                onClick={() => updateSettings({ sessionSize: n })}
                className={cx(
                  'rounded-xl py-2 font-semibold transition',
                  s.sessionSize === n ? 'bg-primary text-white' : 'bg-surface-2 text-muted hover:text-ink',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <p className="mt-6 text-center text-xs text-muted">
        Học cùng Quân · Nội dung tự soạn theo khung trình độ A1–A2 · Dữ liệu chỉ lưu trên máy bạn
      </p>
    </div>
  );
}
