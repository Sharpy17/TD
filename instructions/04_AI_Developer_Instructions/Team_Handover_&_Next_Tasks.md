---
title: "Team Handover & Next Tasks (Руководство для новых разработчиков)"
tags:
  - onboarding
  - team
  - handover
  - tasks
  - roadmap
date: 2026-10-31
---

# 👥 DaiHub — Handover & Инструкция для Новых Разработчиков

Добро пожаловать в разработку **DaiHub (The Gen-Z Anti-Bitrix)**!  
Этот документ содержит всё необходимое, чтобы быстро развернуть проект локально, понять текущую архитектуру и сразу взять в работу одну из готовых задач.

---

## ⚡ 1. Быстрый локальный запуск (Local Setup)

### Системные требования:
- **Node.js**: `v20.x` или новее
- **PostgreSQL**: локальный сервер или Docker контейнер (например, `localhost:5432` или `localhost:5433`)

### Шаги установки:
1. **Клонируйте репозиторий и установите зависимости**:
   ```bash
   git clone https://github.com/Sharpy17/TD.git
   cd TD
   npm install
   ```

2. **Настройте переменные окружения**:
   Скопируйте пример конфига в `.env`:
   ```bash
   cp .env.example .env
   ```
   Внутри `.env` укажите валидную строку подключения к PostgreSQL:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/toguz?schema=public"
   ```

3. **Синхронизируйте схему базы данных**:
   ```bash
   npx prisma db push
   ```

4. **Запустите локальный сервер разработки**:
   ```bash
   npm run dev
   ```
   Приложение откроется на [http://localhost:3000](http://localhost:3000).

5. **Запуск тестов и проверка сборки**:
   ```bash
   npx vitest run     # Запуск 30+ юнит-тестов (Auth, Projects, Modules, Tasks, Voice)
   npm run lint       # Проверка ESLint (React 19 & Next.js 16 rules)
   npm run build      # Проверка продакшен-сборки Turbopack
   ```

---

## 🏗️ 2. Что уже реализовано (Current Architecture & Status)

| Модуль | Статус | Где находится код | Описание |
| :--- | :--- | :--- | :--- |
| **Authentication & Sessions** | ✅ Готово | `lib/auth/`, `app/(auth)/` | Регистрация, логин, безопасный Argon2id/PBKDF2 хешинг с солью, cookie-сессии, защита от брутфорса (lockout). |
| **Projects Engine** | ✅ Готово | `lib/projects/`, `app/projects/` | Создание проектов, авто-сидинг демо-проекта, удаление с каскадной очисткой модулей и задач. |
| **Modules Breakdown** | ✅ Готово | `lib/modules/`, `components/modules/` | Модульные карточки с круговыми SVG-прогрессбарами, выбор иконок, авто-пересчет прогресса. |
| **Task Management** | ✅ Готово | `lib/tasks/`, `components/tasks/` | Создание задач, удаление, **инлайн-переименование по клику**, модалка `✎` с быстрыми пресетами дедлайнов (`8h`, `2d`, `1w`), приоритетами и сменой статуса. |
| **Burning Deadlines** | ✅ Готово | `lib/domain/deadlines.ts`, `components/dashboard/BurningDeadlines.tsx` | UTC-безопасный классификатор дедлайнов (< 24ч = Burning 🔥, просрочено = Overdue ⚠️), неоновая индикация, редактирование дедлайнов прямо из панели. |
| **Voice Lounges (Foundation)** | ✅ Готово | `lib/voice/`, `components/voice/` | Discord-стиль: хранение комнат в PostgreSQL, вход в 1 клик, Web Audio API звуковые эффекты (chimes), глобальный контекст с хоткеями `Ctrl+Shift+M`/`Ctrl+Shift+D`, персистентный плавающий Audio Dock внизу экрана. |
| **Automated Tests** | ✅ 30/30 | `tests/` | Полноценный тестовый раннер Vitest с тестами домена, БД, аутентификации и сервисов. |

---

## 🎯 3. Оставшиеся задачи для команды (Work Tracks & Assignments)

Выберите один из треков ниже и возьмите его в отдельную ветку (`feature/kanban-engine`, `feature/module-chat`, etc.):

---

### 📌 Трек A: Полноценный Канбан и Drag-and-Drop
**Приоритет**: Высокий 🔥  
**Целевой маршрут**: `/projects/[projectId]/kanban`  
**Связанный PRD**: [[01_Product_Requirements/04_Kanban_&_Task_Management]]

- **Что нужно сделать**:
  1. Реализовать страницу Канбан-доски с 4 колонками:
     - `BACKLOG` (Бэклог)
     - `IN_PROGRESS` (В работе)
     - `REVIEW` (Ревью / Тестирование)
     - `DONE` (Готово 🎉)
  2. Добавить интерактивный Drag-and-Drop (рекомендуется `@hello-pangea/dnd` или HTML5 Drag API).
  3. При перемещении карточки в другую колонку вызывать `updateTaskAction` (или специализированный `moveTaskAction`) для мгновенного сохранения нового статуса.
  4. При перетаскивании в `DONE` модуль и проект должны автоматически обновлять процент прогресса.
  5. Карточки на доске должны отображать:
     - Цветовую плашку дедлайна (Burning Red `#FF2A55`, если дедлайн горит).
     - Приоритет (🔥 Critical, ⚡ High, Medium, Low).
     - Аватарку исполнителя.
     - Быстрое инлайн-редактирование или вызов `EditTaskModal`.

---

### 📌 Трек B: Модульные Чат-Каналы и Текстовая Коллаборация
**Приоритет**: Высокий 💬  
**Целевой маршрут**: `/chats` и модульные чаты в сайдбаре  
**Связанный PRD**: [[01_Product_Requirements/05_Chats_&_Realtime_Collab]]

- **Что нужно сделать**:
  1. Реализовать бэкенд-сервис `lib/chat/service.ts`:
     - Создание сообщения `createMessage({ channelId, authorId, content })`.
     - Получение сообщений канала `getMessages(channelId, limit)`.
     - Добавление реакций-эмодзи `toggleReaction({ messageId, userId, emoji })`.
  2. Модель БД `Channel` и `Message` уже есть в `prisma/schema.prisma`!
  3. Создать интерфейс чата:
     - Список каналов по модулям (`#mod-auth`, `#mod-kanban`, `#mod-voice`).
     - Лента сообщений с поддержкой Markdown и блоков кода.
     - Поле ввода сообщения с хоткеем `Enter` для отправки и `Shift+Enter` для новой строки.
     - Быстрые реакции на сообщения (🔥, 🚀, 👍, 💀).

---

### 📌 Трек C: WebRTC LiveKit Voice SFU & Саундборд
**Приоритет**: Средний 🎙️  
**Связанный PRD**: [[01_Product_Requirements/06_Voice_Lounges_&_CoWorking]], [[01_Product_Requirements/07_Soundboards_&_Stickers]]

- **Что нужно сделать**:
  1. **Интеграция LiveKit SFU**:
     - Мы уже создали фундамент `VoiceContext`, персистентный `VoiceAudioDock` и Web Audio chimes!
     - Создать эндпоинт `/api/voice/token` для генерации LiveKit Access Token на основе `roomId` и `userId`.
     - Подключить `livekit-client` в `VoiceContext.tsx` для передачи реального голоса через микрофон и WebRTC аудио-стрима.
  2. **Саундборд (Web Audio Soundboard)**:
     - Создать компонент `components/voice/SoundboardModal.tsx` или вкладку саундборда в Audio Dock.
     - Набор мем-звуков (`Ba-dum-tss`, `Airhorn`, `Success Chime`, `Bruh`, `Victory fanfare`).
     - Хоткеи цифровой клавиатуры `[1]` .. `[9]`.
     - Авто-даккинг: микрофон говорящего приглушается на 20% во время воспроизведения клипа саундборда.

---

### 📌 Трек D: Quick Command Palette (`⌘K`) & Персональный фокус
**Приоритет**: Средний ⚡  
**Связанный PRD**: [[01_Product_Requirements/03_Dashboard_&_Title_Page]]

- **Что нужно сделать**:
  1. Создать глобальную командную строку (`⌘K` / `Ctrl+K`):
     - Быстрый переход к любому проекту (`→ Project Alpha`).
     - Быстрый поиск задачи по названию или ID (`→ Fix WebRTC drift`).
     - Быстрое подключение к голосовой комнате (`→ Hop into #Dev-General`).
  2. Интерактивный чеклист «Мой фокус на сегодня» (`focus-card` в правом сайдбаре дашборда):
     - Отметка чекбокса сразу меняет статус задачи на `DONE`.
     - Анимация зачеркивания и праздничный мини-эффект.

---

## 💡 Правила разработки (Anti-Bitrix Code Standards)

1. **Никакого энтерпрайз-мусора**: Если фича требует больше 3 кликов для выполнения — упростите её. Никаких бесконечных выпадающих списков, обязательных 20 полей и бюрократии.
2. **Строгий TypeScript & React 19**:
   - Никаких `any`. Все доменные сущности строго типизированы в `lib/domain/types.ts`.
   - В React 19 не вызывайте `setState` синхронно внутри тела `useEffect`.
   - Не вызывайте `Date.now()` или `Math.random()` напрямую во время рендера компонентов.
3. **Всегда проверяйте тесты перед коммитом**:
   ```bash
   npx vitest run && npm run lint && npm run build
   ```
4. **Git Workflow**:
   - Создавайте ветки от `main`: `feature/<name>` или `fix/<name>`.
   - Делайте понятные атомарные коммиты.
