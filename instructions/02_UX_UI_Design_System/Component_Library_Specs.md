---
title: "Component Library Specifications"
tags:
  - design
  - components
  - ui
  - frontend
date: 2026-10-29
---

# 🧩 Спецификация компонентов интерфейса

Здесь собраны спецификации ключевых React/Tailwind компонентов, реализующих визуальный стиль Toguz Hub.

---

## 1. Компонент: `ModuleCard` (Карточка модуля на дашборде)

Отображается на [[03_Dashboard_&_Title_Page|Главной странице]] в сетке проекта.

### Пропсы (Props):
```typescript
interface ModuleCardProps {
  id: string;
  name: string;
  description?: string;
  icon: string; // Lucide icon name или emoji
  totalTasks: number;
  completedTasks: number;
  burningTasksCount: number;
  channelSlug: string;
  leadUser: {
    name: string;
    avatarUrl: string;
  };
  onClick: () => void;
}
```

### Визуальные состояния:
* **Normal**: Фон `bg-surface-1`, тонкая граница `border-subtle`, мягкий ховер с подъемом `translate-y-[-2px]`.
* **Burning Alert**: Если `burningTasksCount > 0`, в правом верхнем углу горит пульсирующий бейдж `🔥 N burning`, а граница карточки подсвечивается легким красным оттенком.
* **100% Shipped**: Зеленый контур, галочка, текст `100% Shipped`.

---

## 2. Компонент: `RadialProgressRing` (Круговой индикатор %)

Отображает процент готовности модуля в виде плавного SVG-кольца.

### Пропсы:
```typescript
interface RadialProgressRingProps {
  percentage: number; // 0 .. 100
  size?: number; // default: 64px
  strokeWidth?: number; // default: 6px
  gradientVariant?: 'auto' | 'burning' | 'emerald';
}
```

### Реализация SVG анимации:
* Расчет радиуса: $r = (\text{size} - \text{strokeWidth}) / 2$.
* Длина окружности: $C = 2 \pi r$.
* Смещение: $\text{offset} = C - (P / 100) \times C$.
* CSS Transition: `stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)`.

---

## 3. Компонент: `KanbanCard` (Карточка задачи)

Основной строительный блок [[04_Kanban_&_Task_Management|Канбан-доски]].

### Пропсы:
```typescript
interface KanbanCardProps {
  id: string;
  title: string;
  moduleName: string;
  dueDate: Date | null;
  assignee: {
    name: string;
    avatarUrl: string;
  } | null;
  commentsCount: number;
  checklistProgress?: { completed: number; total: number };
  isDragging: boolean;
}
```

### Логика подсветки дедлайна:
```typescript
function getDeadlineStatus(dueDate: Date | null): 'none' | 'safe' | 'warning' | 'burning' | 'overdue' {
  if (!dueDate) return 'none';
  const hoursLeft = (dueDate.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < 0) return 'overdue';
  if (hoursLeft <= 24) return 'burning';
  if (hoursLeft <= 72) return 'warning';
  return 'safe';
}
```

---

## 4. Компонент: `SoundboardPad` (Кнопка саундборда)

Интерактивная кнопка воспроизведения мема в голосовой канал.

### Пропсы:
```typescript
interface SoundboardPadProps {
  id: string;
  name: string;
  emoji: string;
  hotkey?: string;
  audioUrl: string;
  durationSec: number;
  isCooldown: boolean;
  onPlay: (soundId: string) => void;
}
```

### Анимация нажатия:
* При клике кнопка делает «отдачу» (`scale: 0.94` на 100мс), после чего от нее расходятся волновые круги (Ripple effect).
* Во время воспроизведения отображается кольцо прогресса проигрывания трека.

---

## 5. Компонент: `VoiceAudioDock` (Закрепленная панель звонка)

Закрепленный виджет в нижней части экрана, когда пользователь подключен к голосовой комнате [[06_Voice_Lounges_&_CoWorking]].

### Элементы:
* Иконка антенны + Название комнаты (зеленый статус *"Voice Connected"*).
* Быстрые кнопки: `Mic (Mute)`, `Headphones (Deafen)`, `Screen (Share)`, `Soundboard (Pop-up)`.
* Кнопка завершения звонка: Ярко-красная телефонная трубка `Disconnect`.

Смотрите далее:
- [[Color_Palette_&_Deadline_Hues|Цветовая палитра]]
- [[07_Soundboards_&_Stickers|Саундборд]]
- [[03_Technical_Architecture/WebRTC_&_Voice_Engine|WebRTC движок]]
