---
title: "Edge Cases & Architectural Pitfalls"
tags:
  - ai-instructions
  - edge-cases
  - bugs
  - troubleshooting
date: 2026-10-29
---

# ⚠️ Подводные камни и Граничные случаи (Edge Cases & Pitfalls)

Любая ИИ-модель, приступающая к реализации Toguz Hub, столкнется со специфическими техническими трудностями. В этом документе разобраны все ловушки и приведены готовые решения.

---

## 1. Ловушка часовых поясов при расчете горящих дедлайнов

### Проблема:
Разработчики стартапа могут сидеть в Бишкеке (UTC+6), Берлине (UTC+1) и Сан-Франциско (UTC-8). Если ИИ-разработчик напишет расчет разницы времени без нормализации:
```javascript
// ОШИБКА: Использование локального времени сервера или строки без таймзоны
const isBurning = (task.dueDate - new Date()) < 24 * 3600 * 1000;
```
Это приведет к тому, что для одного разработчика дедлайн уже горит красным, а для другого — еще нет!

### Решение:
Все дедлайны в базе данных хранятся строго в **ISO 8601 UTC** (`TIMESTAMP WITH TIME ZONE`).
На клиенте вычисление оставшегося времени всегда ведется через миллисекунды эпохи:
```typescript
export function getRemainingHours(utcDueDateString: string): number {
  const dueTimestamp = new Date(utcDueDateString).getTime();
  const currentUtcTimestamp = Date.now();
  return (dueTimestamp - currentUtcTimestamp) / (1000 * 60 * 60);
}
```

---

## 2. Деление на ноль при расчете % прогресса модуля

### Проблема:
Когда создается новый модуль, в нем еще нет задач ($N_{\text{TOTAL}} = 0$). Попытка рассчитать:
```typescript
const progress = Math.round((doneCount / totalCount) * 100); // 0 / 0 = NaN!
```
В UI это приведет к ошибкам рендеринга `NaN%` или падению SVG прогресс-ринга.

### Решение:
Всегда защищать функцию расчета защитным условием (Guard Clause):
```typescript
export function calculateModuleProgress(doneCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  const rawProgress = (doneCount / totalCount) * 100;
  return Math.min(100, Math.max(0, Math.round(rawProgress)));
}
```

---

## 3. Политика автовоспроизведения браузера (Browser Autoplay Policy)

### Проблема:
Современные браузеры (Chrome, Safari, Firefox) запрещают создавать или запускать активный `AudioContext` до тех пор, пока пользователь не совершит физический клик по странице. Если приложение пытается воспроизвести звук саундборда сразу при загрузке:
`The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.`

### Решение:
Инициализировать `AudioContext` в состоянии `suspended`, а при первом любом клике в приложении вызывать `.resume()`:
```typescript
useEffect(() => {
  const unlockAudio = () => {
    if (audioEngine.ctx.state === 'suspended') {
      audioEngine.ctx.resume();
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };

  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
}, []);
```

---

## 4. Спам саундборда и рассинхрон аудио (Soundboard Chaos)

### Проблема:
Шутник в команде может зажать клавишу хоткея `[1]` и отправить 50 пакетов с «Airhorn» за 1 секунду. Если сервер просто перешлет их всем в комнату, браузеры коллег зависнут, а из колонок пойдет жуткий треск.

### Решение:
1. **Троттлинг на клиенте**: Debounce / Throttle нажатий (макс 1 звук в 3 секунды).
2. **Валидация на сервере**: Redis Sliding Window Rate Limiter. Если лимит превышен — пакет отбрасывается.
3. **Отсечение устаревших звуков**: Пакет звука содержит `sentAt: timestamp`. Если сетевой пинг задержал пакет более чем на 1500мс, клиент **НЕ играет звук**.

---

## 5. Коллизии порядка сортировки задач на Канбане (Lexorank Float Collisions)

### Проблема:
Если порядок карточек хранить как простые целые числа (`orderIndex: 1, 2, 3`), то вставка карточки между 1 и 2 требует обновления всех последующих 100 карточек в базе данных (медленный `UPDATE`).
Если использовать `Float` (`(1 + 2) / 2 = 1.5`), то при многократных вставках на одно место число знаков после запятой переполнит `float64` (`1.0000000000000002`).

### Решение:
Использовать строковый алгоритм **Lexorank** (как в Jira/Linear) либо периодический пересчет шага:
Если разница между соседними `orderIndex` становится меньше `0.0001`, фоновый воркер производит ребалансировку колонки с шагом `1000` (`1000, 2000, 3000...`).

---

## 6. Зависание пользователей в голосовых комнатах ("Ghost Users")

### Проблема:
Если у пользователя внезапно пропал интернет или выключился ноутбук, WebRTC сессия может не закрыться корректно, и пользователь остается висеть в комнате как «призрак».

### Решение:
Каждые 5 секунд клиент отправляет легкий Heartbeat-пинг в WebSocket/LiveKit. Если пинг отсутствует более 12 секунд, медиа-сервер принудительно удаляет участника из комнаты и эмитит событие `voice:user_left`.

Смотрите далее:
- [[Master_AI_Guidelines|Главное руководство для ИИ]]
- [[AI_Prompt_Playbook|Сборник готовых промптов]]
- [[03_Technical_Architecture/WebRTC_&_Voice_Engine|WebRTC архитектура]]
