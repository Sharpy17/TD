---
title: "Soundboard Media Pipeline"
tags:
  - architecture
  - audio
  - web-audio-api
  - soundboard
date: 2026-10-29
---

# 🔊 05. Пайплайн Саундборда (Soundboard Media Engine)

Саундборд в Toguz Hub — это не просто вызов `<audio src="..."/>`. Он спроектирован так, чтобы звучать синхронно у всех участников голосовой комнаты с нулевой задержкой и без перегрузки сети.

---

## 1. Архитектурный выбор: Локальный рендеринг vs SFU Инъекция

Существует два способа реализовать саундборд в реальном времени:

```mermaid
graph TD
    subgraph BAD_WAY [Способ 1: Инъекция в микрофонный WebRTC стрим]
        A1[Клиент микширует звук в свой WebRTC стрим] --> B1[SFU перекодирует поток]
        B1 --> C1[Собеседники слышат звук с потерей качества Opus и задержкой 300мс]
    end

    subgraph OUR_WAY [Способ 2: WebSocket Trigger + Локальный Web Audio API (Наш подход)]
        A2[Клиент жмет кнопку саундборда] -->|Легкий WS сигнал 50 байт| WS[WebSocket Server]
        WS -->|Бродкаст всем в комнате| Clients[Все клиенты в комнате]
        Clients -->|Мгновенно из RAM кэша| WebAudio[Web Audio API Playback]
    end
```

### Преимущества нашего подхода:
1. **Качество 100%**: Аудио сэмпл звучит в полном стерео с исходным качеством, а не через моно-кодек речи Opus.
2. **Нулевая задержка**: Воспроизведение из предзагруженного `AudioBuffer` в оперативной памяти браузера начинается за **< 5 мс**.
3. **Трафик**: Вместо пересылки мегабайтов аудиоданных по WebRTC передается лишь крошечный JSON-пакет события (50 байт).

---

## 2. Клиентский Web Audio API граф

Каждый клиент настраивает граф узлов:

```typescript
class SoundboardAudioEngine {
  private ctx: AudioContext;
  private soundCache: Map<string, AudioBuffer> = new Map();
  private limiterNode: DynamicsCompressorNode;
  private masterGain: GainNode;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Лимитер для защиты ушей
    this.limiterNode = this.ctx.createDynamicsCompressor();
    this.limiterNode.threshold.setValueAtTime(-14, this.ctx.currentTime);
    this.limiterNode.knee.setValueAtTime(4, this.ctx.currentTime);
    this.limiterNode.ratio.setValueAtTime(20, this.ctx.currentTime);
    this.limiterNode.attack.setValueAtTime(0.005, this.ctx.currentTime);
    this.limiterNode.release.setValueAtTime(0.05, this.ctx.currentTime);

    // Мастер громкости саундборда (по умолчанию 65%)
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.65, this.ctx.currentTime);

    this.masterGain.connect(this.limiterNode);
    this.limiterNode.connect(this.ctx.destination);
  }

  // Предзагрузка сэмплов в память
  async preloadSound(id: string, url: string): Promise<void> {
    if (this.soundCache.has(id)) return;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.soundCache.set(id, audioBuffer);
  }

  // Воспроизведение по сигналу
  playSound(id: string): void {
    const buffer = this.soundCache.get(id);
    if (!buffer) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    source.start(0);
  }
}
```

---

## 3. Серверный пайплайн загрузки звуков (Ingestion & Normalization)
Когда пользователь загружает новый MP3-звук:
1. **Проверка**: Размер файла $\le 500$ КБ, длительность $\le 5.0$ секунд.
2. **Транскодирование**: Запуск утилиты `ffmpeg` на сервере:
   ```bash
   ffmpeg -i input.mp3 -af loudnorm=I=-16:LRA=11:TP=-1.5 -c:a libmp3lame -b:a 128k output.mp3
   ```
   *Параметр `-af loudnorm` нормализует громкость по международному стандарту EBU R128 (-16 LUFS).*
3. **Хранилище**: Готовый файл сохраняется в S3/R2 и раздается через CDN.

Смотрите далее:
- [[07_Soundboards_&_Stickers|PRD Саундборда]]
- [[02_UX_UI_Design_System/Sound_&_Haptic_Design|Звуковой дизайн]]
- [[Realtime_Sync_&_WebSockets|WebSocket события]]
