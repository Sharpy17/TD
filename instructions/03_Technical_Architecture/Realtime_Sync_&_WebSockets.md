---
title: "Realtime Sync & WebSockets Protocol"
tags:
  - architecture
  - realtime
  - websockets
  - events
date: 2026-10-29
---

# ⚡ 03. Реалтайм синхронизация и протокол WebSockets

Toguz Hub — это живое приложение. Изменения, сделанные одним разработчиком (перенос задачи, вход в голосовую комнату, запуск звука саундборда), должны отображаться у остальных членов команды **быстрее чем за 100 миллисекунд**.

---

## 1. Схема каналов событий (Channel Taxonomy)

```
ws://api.toguz.hub/realtime?token=JWT_TOKEN

ROOMS & SUBSCRIBERS:
├── workspace:{workspaceId}          (Глобальные события: проекты, модули, статус присутствия)
├── project:{projectId}:kanban       (События канбан-доски: перемещение задач, drag-and-drop)
├── voice:{voiceRoomId}              (События голосовой комнаты: speaking, mute, soundboard)
└── channel:{channelId}              (Текстовые сообщения чата, реакции)
```

---

## 2. Спецификация событий (Event Dictionary)

### А. Канбан и Задачи (Kanban & Tasks)

#### `task:move` (Client → Server)
Отправляется при завершении Drag-and-Drop:
```json
{
  "event": "task:move",
  "data": {
    "taskId": "task_123",
    "targetStatus": "DONE",
    "newOrderIndex": 4.5,
    "moduleId": "mod_auth"
  }
}
```

#### `task:updated` (Server → Workspace Broadcast)
Бродкаст всем клиентам проекта для обновления доски:
```json
{
  "event": "task:updated",
  "data": {
    "taskId": "task_123",
    "status": "DONE",
    "moduleId": "mod_auth",
    "updatedBy": "usr_dastan",
    "timestamp": "2026-10-29T23:00:00Z"
  }
}
```

#### `module:progress_updated` (Server → Workspace Broadcast)
Уведомление об изменении процента готовности:
```json
{
  "event": "module:progress_updated",
  "data": {
    "moduleId": "mod_auth",
    "newProgress": 100,
    "completedTasks": 8,
    "totalTasks": 8,
    "hasBurningTasks": false
  }
}
```

---

### Б. Голосовые комнаты и Саундборд (Voice & Soundboard)

#### `soundboard:trigger` (Client → Server)
Запрос на воспроизведение звука:
```json
{
  "event": "soundboard:trigger",
  "data": {
    "clipId": "clip_airhorn",
    "voiceRoomId": "room_dev"
  }
}
```

#### `soundboard:broadcast` (Server → Room Clients)
Трансляция аудио-события участникам комнаты:
```json
{
  "event": "soundboard:broadcast",
  "data": {
    "clipId": "clip_airhorn",
    "audioUrl": "https://cdn.toguz.hub/sounds/airhorn.mp3",
    "triggeredBy": {
      "id": "usr_alex",
      "name": "Alex"
    },
    "timestamp": 1793198400000
  }
}
```

#### `voice:speaking_state` (LiveKit / Server → Room Clients)
Индикация речи (зеленый ореол вокруг аватара):
```json
{
  "event": "voice:speaking_state",
  "data": {
    "userId": "usr_dastan",
    "isSpeaking": true
  }
}
```

---

## 3. Обработка рассинхрона и реконнекта (Resilience)
* **Exponential Backoff**: При потере WebSocket соединения клиент повторяет попытки подключения через `1s`, `2s`, `4s`, `8s` (макс. 30с).
* **State Reconciliation**: При успешном переподключении клиент запрашивает легковесный хэш состояния (`GET /api/sync/state-hash`). Если хэш не совпадает — подтягиваются свежие данные модулей и задач.
* **Dead-drop Protection**: Звуки саундборда, пришедшие с задержкой более 1.5 секунд от серверного timestamp, игнорируются клиентом, чтобы предотвратить эффект «запоздалого взрыва».

Смотрите далее:
- [[WebRTC_&_Voice_Engine|WebRTC и Голос]]
- [[Soundboard_Media_Pipeline|Пайплайн воспроизведения саундборда]]
- [[04_Kanban_&_Task_Management|Канбан-доска]]
