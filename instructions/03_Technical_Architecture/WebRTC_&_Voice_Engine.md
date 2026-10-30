---
title: "WebRTC & Voice Engine (LiveKit SFU)"
tags:
  - architecture
  - webrtc
  - livekit
  - voice
  - discord
date: 2026-10-29
---

# 🎙️ 04. WebRTC и Голосовой движок

Чтобы добиться уровня Discord по качеству связи и отзывчивости, мы используем **SFU (Selective Forwarding Unit)** архитектуру на базе **LiveKit** или **mediasoup**.

---

## 1. Почему SFU, а не P2P Mesh?

| Схема | Нагрузка на клиента при 6 участниках | Стабильность в стартапе |
| :--- | :--- | :--- |
| **P2P Mesh (Прямые связи)** | Каждый клиент отправляет 5 стримов и принимает 5 ($N \times (N-1)$) = **Тормоза и троттлинг процессора** | ❌ Провал при > 3 пользователях |
| **SFU (LiveKit / Mediasoup)** | Каждый клиент отправляет **1 аудио-стрим** на сервер SFU, а сервер эффективно перенаправляет пакеты | ✅ Идеально для 10–50 человек |

```mermaid
graph TD
    subgraph SFU_TOPOLOGY [Архитектура LiveKit SFU]
        User1[User 1 (Микрофон)] -->|1 Upload Track| ServerSFU[LiveKit SFU Server]
        User2[User 2 (Микрофон)] -->|1 Upload Track| ServerSFU
        User3[User 3 (Микрофон)] -->|1 Upload Track| ServerSFU
        
        ServerSFU -->|Selective Downlink| User1
        ServerSFU -->|Selective Downlink| User2
        ServerSFU -->|Selective Downlink| User3
    end
```

---

## 2. Конфигурация аудиотреков (Opus Audio Parameters)

Для достижения студийного Discord-качества звука при минимальном потреблении полосы пропускания используются следующие параметры WebRTC:

```typescript
const livekitAudioOptions = {
  audio: {
    channelCount: 1, // Моно для голоса
    echoCancellation: true, // Подавление эха от динамиков ноутбука
    noiseSuppression: true, // Подавление шума вентиляторов и клавиатуры
    autoGainControl: true, // Выравнивание громкости тихого шепота
    sampleRate: 48000, // 48 kHz (Fullband Audio)
  },
  publishDefaults: {
    audioBitrate: 64000, // 64 kbps Opus (кристально чистый голос)
    dtx: true, // Discontinuous Transmission (экономит 50% трафика в тишине)
    red: true, // Redundant Audio Data (защита от потери пакетов)
  }
};
```

---

## 3. Детекция говорящего (Voice Activity Detection - VAD)
* Чтобы аватарка подсвечивалась зеленым кругом в реальном времени, клиентский SDK LiveKit отслеживает уровень звукового сигнала (`AudioLevelObserver`).
* **Порог срабатывания**: При громкости > `-45 dBFS` флаг `isSpeaking` переходит в `true`.
* **Hangover Time**: Состояние `speaking` удерживается еще 250 мс после окончания звука, чтобы рамка не мерцала между словами.

---

## 4. Демонстрация экрана (Screen Sharing)
* **Разрешение**: До 1080p при 30–60 FPS.
* **Видеокодек**: VP9 / AV1 (с фолбэком на H.264 для Safari/мобильных).
* **Симплекс**: Скриншер автоматически оптимизируется под текстовый контент (`contentHint: 'detail'`), делая текст кода в IDE идеально резким и читаемым без артефактов сжатия.

Смотрите далее:
- [[Soundboard_Media_Pipeline|Пайплайн Саундборда]]
- [[06_Voice_Lounges_&_CoWorking|PRD Голосовых комнат]]
- [[04_AI_Developer_Instructions/Edge_Cases_&_Pitfalls|Граничные случаи WebRTC]]
