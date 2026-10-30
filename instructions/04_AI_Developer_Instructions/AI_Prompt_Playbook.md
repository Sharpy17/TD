---
title: "AI Prompt Playbook: Ready-to-Use Tasks"
tags:
  - ai-instructions
  - prompts
  - playbook
  - tasks
date: 2026-10-29
---

# 📋 Сборник готовых промптов для ИИ (AI Prompt Playbook)

Используйте эти готовые, тщательно сформулированные промпты при постановке задач другим ИИ-агентам (Claude 3.7 Sonnet, Gemini 2.5 Pro, GPT-4o, Cursor и др.).

---

## Промпт 1: Разработка Главной страницы (Title Dashboard)

```markdown
Ты работаешь над проектом Toguz Hub (The Anti-Bitrix для стартапов).
Твоя задача — создать компонент Главной страницы `app/(dashboard)/page.tsx`.

ТРЕБОВАНИЯ К ДИЗАЙНУ И СТЕКУ:
1. Стек: Next.js 15 (App Router), Tailwind CSS, Framer Motion, Lucide React.
2. Эстетика: Тёмная тема (фон #0B0D13, карточки #131620, акценты #FF2A55 и #5865F2). В стиле Linear + Discord.
3. Компоненты экрана:
   а) Верхний баннер "🔥 Burning Deadlines": задачи, где осталось < 24 часов до дедлайна или просроченные. Подсвети неоновым пульсирующим красным (#FF2A55) с обратным отсчетом.
   б) Секция "Active Project Modules": карточки модулей. В каждой карточке отображай иконку, название, lead разработчика, количество выполненных задач (8/10) и круговой SVG прогресс-бар % выполнения с плавным градиентом.
   в) Сайд-панель "Voice Lounges Quick Hop-In": список комнат с аватарками присутствующих пользователей и кнопкой мгновенного подключения.
4. Ознакомься со спецификацией:
   - [[01_Product_Requirements/03_Dashboard_&_Title_Page]]
   - [[02_UX_UI_Design_System/Color_Palette_&_Deadline_Hues]]
5. Напиши чистый, типобезопасный TypeScript код без заглушек any.
```

---

## Промпт 2: Разработка Канбан-доски с цветовыми дедлайнами

```markdown
Ты разрабатываешь ядро Канбан-доски для Toguz Hub.
Твоя задача — создать компонент `components/kanban/KanbanBoard.tsx`.

ТРЕБОВАНИЯ:
1. Стек: React, @hello-pangea/dnd (или @dnd-kit), Tailwind CSS.
2. Колонки: BACKLOG, IN_PROGRESS, REVIEW, DONE.
3. Цветовая система дедлайнов (ОБЯЗАТЕЛЬНО):
   - Если дедлайн через > 72ч: нейтральный/спокойный цвет.
   - Если дедлайн через 24–72ч: янтарный (#FFAA00).
   - Если дедлайн через < 24ч: горящий красный (#FF2A55) с пульсирующей тенью `box-shadow: 0 0 14px rgba(255, 42, 85, 0.45)` и бейджем 🔥.
   - Если просрочен: малиновый (#DC2626) с бейджем OVERDUE.
4. UX особенности:
   - Optimistic Update: при отпускании карточки UI обновляется мгновенно.
   - При переносе в DONE: запуск легкой анимации конфетти (canvas-confetti) и звуковой триггер завершения.
   - Никаких громоздких меню Bitrix: быстрое создание задачи по кнопке '+' внизу колонки.
5. Изучи документы:
   - [[01_Product_Requirements/04_Kanban_&_Task_Management]]
   - [[02_UX_UI_Design_System/Component_Library_Specs]]
```

---

## Промпт 3: Реализация Саундборда и Web Audio Engine

```markdown
Ты создаешь движок Саундборда для проекта Toguz Hub.
Твоя задача — реализовать клиентский класс `lib/audio/SoundboardEngine.ts` и компонент интерфейса `components/voice/SoundboardModal.tsx`.

ТРЕБОВАНИЯ:
1. Стек: Web Audio API, TypeScript, Lucide Icons, Tailwind CSS.
2. Звуковая безопасность:
   - Включи DynamicsCompressorNode с порогом -14 dBFS, чтобы звуки не глушили пользователей.
   - Громкость по умолчанию: 65% с плавным даккингом.
3. Синхронизация:
   - Не микшируй аудио в WebRTC микрофонный трек! Звук инициируется через WebSocket сигнал и воспроизводится локально из предзагруженного AudioBuffer в памяти.
4. UI Саундборда:
   - Сетка из 9 кнопок (Airhorn, Victory Horn, Emotional Damage, Sad Violin, Red Alert, Big Brain, Cork Pop, Crickets, Vine Boom).
   - Поддержка горячих клавиш клавиатуры [1] .. [9].
   - Троттлинг: не чаще одного звука в 3 секунды с визуальным кольцом перезарядки (cooldown).
5. Спецификации:
   - [[01_Product_Requirements/07_Soundboards_&_Stickers]]
   - [[03_Technical_Architecture/Soundboard_Media_Pipeline]]
```

---

## Промпт 4: Бэкенд и расчет прогресса модулей

```markdown
Ты реализуешь бэкенд логику обновления задач и пересчета прогресса модулей.
Файл: `server/services/taskService.ts`.

ТРЕБОВАНИЯ:
1. Стек: Node.js / TypeScript, Prisma ORM, PostgreSQL, Socket.io.
2. При смене статуса задачи:
   - Обнови запись в таблице Task.
   - Пересчитай процент готовности модуля: Math.round((doneCount / totalCount) * 100).
   - Учти граничный случай: если totalCount === 0, верни 0% (защита от деления на ноль).
   - Обнови cachedProgress в таблице Module и Project.
   - Отправь события WebSocket: `task:updated` и `module:progress_updated`.
3. Защита от спама дедлайнов:
   - Сохраняй все даты строго в ISO UTC.
4. Изучи спецификацию:
   - [[03_Technical_Architecture/Database_Schema_&_Data_Models]]
   - [[04_AI_Developer_Instructions/Edge_Cases_&_Pitfalls]]
```

Смотрите далее:
- [[Master_AI_Guidelines|Главные правила для ИИ]]
- [[Implementation_Roadmap|Дорожная карта реализации]]
