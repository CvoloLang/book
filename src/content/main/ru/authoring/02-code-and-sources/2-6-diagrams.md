# 2.6 Декларативные схемы

Блок `diagram` превращает JSON-описание в векторную схему. Он поддерживает вложенные контейнеры, ячейки памяти, состояния переменных и связи. Рендеринг выполняется на сервере; в браузере не требуется графический движок. Схема использует текущую тему Book Cvolo.

В меню «⋯» справа вверху каждой схемы доступны кнопки скачивания самостоятельного SVG в светлой и тёмной теме. Сохранённый файл можно подключить в любом обычном Markdown: `![Описание](diagram-light.svg)`.

## Примеры

### Стек и куча

```diagram
{
  "title": "Stack and heap",
  "caption": "Fields are stored inside the local value on the left; the local variable on the right holds an internal address. Optimizations are omitted.",
  "body": {
    "kind": "column",
    "gap": 40,
    "children": [
      {
        "kind": "group",
        "title": "STACK",
        "width": 650,
        "children": [
          {
            "kind": "row",
            "gap": 32,
            "align": "start",
            "children": [
              {
                "kind": "column",
                "children": [
                  { "kind": "text", "code": "point : Point" },
                  {
                    "kind": "cells",
                    "children": [
                      { "kind": "node", "title": "X", "code": "10", "width": 136 },
                      { "kind": "node", "title": "Y", "code": "20", "width": 136 }
                    ]
                  },
                  { "kind": "text", "text": "Fields inside the local value" }
                ]
              },
              {
                "kind": "column",
                "children": [
                  { "kind": "text", "code": "other : Point" },
                  { "kind": "node", "id": "address", "title": "Instance address", "tone": "owner", "width": 272, "height": 72 }
                ]
              }
            ]
          }
        ]
      },
      {
        "kind": "group",
        "title": "HEAP",
        "tone": "owner",
        "width": 650,
        "children": [
          {
            "kind": "column",
            "gap": 8,
            "children": [
              { "kind": "text", "code": "Point" },
              {
                "kind": "cells",
                "id": "value",
                "children": [
                  { "kind": "node", "title": "X", "code": "30", "tone": "owner", "width": 280 },
                  { "kind": "node", "title": "Y", "code": "40", "tone": "owner", "width": 280 }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "edges": [
    { "from": "address", "to": "value", "fromSide": "bottom", "toSide": "top" }
  ]
}
```

### Массив и срез

```diagram
{
  "title": "Fixed array and slice",
  "caption": "A slice contains a data address and length. Elements live in the allocated buffer.",
  "body": {
    "kind": "column",
    "gap": 40,
    "children": [
      {
        "kind": "group",
        "title": "STACK",
        "width": 670,
        "children": [
          {
            "kind": "row",
            "align": "start",
            "gap": 30,
            "children": [
              {
                "kind": "column",
                "gap": 10,
                "children": [
                  { "kind": "text", "code": "int[4] damageEvents" },
                  {
                    "kind": "cells",
                    "children": [
                      { "kind": "node", "title": "[0]", "code": "15", "width": 70 },
                      { "kind": "node", "title": "[1]", "code": "20", "width": 70 },
                      { "kind": "node", "title": "[2]", "code": "10", "width": 70 },
                      { "kind": "node", "title": "[3]", "code": "5", "width": 70 }
                    ]
                  },
                  { "kind": "text", "text": "Elements inside the value" }
                ]
              },
              {
                "kind": "column",
                "gap": 10,
                "children": [
                  { "kind": "text", "code": "int[] objectIds" },
                  {
                    "kind": "cells",
                    "children": [
                      { "kind": "node", "id": "data", "title": "Data address", "tone": "owner", "width": 155 },
                      { "kind": "node", "title": "Length", "code": "3", "width": 126 }
                    ]
                  },
                  { "kind": "text", "text": "Address and element count" }
                ]
              }
            ]
          }
        ]
      },
      {
        "kind": "group",
        "title": "HEAP",
        "tone": "owner",
        "width": 670,
        "children": [
          {
            "kind": "column",
            "gap": 10,
            "children": [
              { "kind": "text", "code": "heap int[3]" },
              {
                "kind": "cells",
                "id": "buffer",
                "children": [
                  { "kind": "node", "title": "[0]", "code": "1", "tone": "owner", "width": 175 },
                  { "kind": "node", "title": "[1]", "code": "2", "tone": "owner", "width": 175 },
                  { "kind": "node", "title": "[2]", "code": "3", "tone": "owner", "width": 175 }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "edges": [
    { "from": "data", "to": "buffer", "fromSide": "bottom", "toSide": "top" }
  ]
}
```

### Передача владения

```diagram
{
  "title": "Moving a value",
  "caption": "Ownership transfer without duplicating the resource.",
  "body": {
    "kind": "row",
    "gap": 38,
    "align": "end",
    "children": [
      {
        "kind": "column",
        "gap": 18,
        "children": [
          { "kind": "text", "title": "Before moving" },
          { "kind": "node", "id": "first", "code": "first", "text": "Owner", "width": 260, "height": 78 },
          { "kind": "space", "height": 68 },
          { "kind": "node", "id": "resource1", "title": "Resource", "tone": "owner", "width": 260, "height": 64 }
        ]
      },
      {
        "kind": "column",
        "gap": 18,
        "children": [
          { "kind": "text", "title": "After moving" },
          { "kind": "node", "code": "first", "text": "Moved", "moved": true, "width": 260, "height": 78 },
          { "kind": "node", "id": "second", "code": "second", "text": "New owner", "tone": "owner", "width": 260, "height": 68 },
          { "kind": "node", "id": "resource2", "title": "Resource", "tone": "owner", "width": 260, "height": 64 }
        ]
      }
    ]
  },
  "edges": [
    { "from": "first", "to": "resource1" },
    { "from": "second", "to": "resource2" },
    { "from": "resource1", "to": "resource2", "tone": "neutral" }
  ]
}
```

### Последовательность операций

```diagram
{
  "title": "From Markdown to SVG",
  "body": {
    "kind": "column",
    "gap": 26,
    "children": [
      { "kind": "node", "id": "markdown", "title": "Markdown", "text": "diagram block", "width": 260 },
      { "kind": "node", "id": "extract", "code": "extractCodeBlocks", "text": "Extract the fence", "width": 260 },
      { "kind": "node", "id": "parse", "title": "Diagram parser", "text": "Validate the model", "width": 260 },
      { "kind": "node", "id": "render", "title": "SVG renderer", "text": "Layout and rendering", "width": 260 },
      { "kind": "node", "id": "book", "title": "Book Cvolo", "text": "Rendered diagram", "width": 260 }
    ]
  },
  "edges": [
    { "from": "markdown", "to": "extract", "tone": "neutral" },
    { "from": "extract", "to": "parse", "tone": "neutral" },
    { "from": "parse", "to": "render", "tone": "neutral" },
    { "from": "render", "to": "book", "tone": "neutral" }
  ]
}
```

## Формат

Содержимое блока — строгий JSON без комментариев и завершающих запятых. Корневой объект содержит `body` (обязательный элемент), необязательные `title`, `caption` и массив `edges`.

| Элемент `kind` | Назначение |
| --- | --- |
| `row` | Горизонтальная последовательность детей |
| `column` | Вертикальная последовательность детей |
| `group` | Контейнер с рамкой, заголовком и вертикальной компоновкой |
| `node` | Блок с заголовком, кодом или пояснением |
| `cells` | Непрерывный ряд прямоугольных ячеек `node` |
| `text` | Текст без рамки |
| `space` | Пустое место для выравнивания |

Общие поля: `id` (уникальное имя для связи), `title` (полужирный текст), `code` (моноширинный), `text` (пояснение), `tone` (семантический цвет), `moved` (пунктир и зачёркнутый код), `width`, `height` (минимальные размеры в единицах SVG), `gap` (промежуток между детьми), `align` (`start`, `center`, `end` по поперечной оси), `children`.

Цвета: `neutral`, `owner` (фиолетовый), `read` (синий), `write` (янтарный), `success` (зелёный), `error` (красный). Для стрелок укажите `from` и `to` — идентификаторы элементов, при необходимости `tone`, `fromSide`, `toSide` (`top`, `right`, `bottom`, `left`). Движок ищет короткий прямоугольный маршрут между блоками; если он не найден, увеличьте `gap` или выберите стороны вручную. Пересечения нескольких стрелок между собой пока не оптимизируются. Размеры текста оцениваются без зависимости от установленных шрифтов.

Пример исходного блока:

````markdown
```diagram
{
  "title": "Example",
  "body": {
    "kind": "column",
    "gap": 28,
    "children": [
      { "kind": "node", "id": "a", "code": "owner" },
      { "kind": "node", "id": "b", "title": "Resource", "tone": "owner" }
    ]
  },
  "edges": [
    { "from": "a", "to": "b" }
  ]
}
```
````

## Экспорт из командной строки

```bash
npm run diagrams:export -- path/to/article.md ./images both
```

Команда извлекает все блоки `diagram` и сохраняет отдельные SVG. Допускается передать JSON-файл с одной схемой. Вместо `both` можно указать `light` или `dark`.

Для проверки используется `npm run diagrams:test`. Некорректные свойства, повторяющиеся идентификаторы и несуществующие связи приводят к диагностике при сборке. На экранах до 767 CSS-пикселей широкие схемы прокручиваются горизонтально в пределах графической области; на остальных экранах SVG вписывается в доступную ширину. Интерактивные карточки занимают всю ширину статьи.

Ограничения первой версии: до 60 элементов, 40 связей, 10 уровней вложенности; нет интерактивных графов, анимации и полного автоматического размещения произвольных графов. Для сложной схемы задавайте ряды, колонки и промежутки явно.

## Оформление

У корня можно задать минимальную `width` и `style` (фон, рамка, прозрачность и скругление). У элементов и связей `style` поддерживает:

| Свойство | Назначение |
| --- | --- |
| `color` | HEX-акцент |
| `fill`, `stroke`, `textColor` | Независимые HEX-цвета |
| `fillOpacity`, `strokeOpacity` | Прозрачность от 0 до 1 |
| `strokeWidth`, `radius` | Толщина границы и скругление |
| `fontSize`, `valueSize` | Размер текста и значения |
| `textAlign` | start, center, end |
| `dashed` | Пунктирная граница |

Допустимы #RGB, #RGBA, #RRGGBB и #RRGGBBAA. Альфа-канал HEX умножается на заданную прозрачность; для непрозрачной заливки задайте `fillOpacity: 1`. У связи можно указать `label` и `arrow: false` для линии без наконечника. Свойства применяются к соответствующим элементам, а не произвольному CSS.

См. [интерактивные визуализации](2-7-interactive-diagrams.md).

Заголовок и меню «⋯» находятся в шапке карточки и не прокручиваются вместе с графикой. На мобильных экранах (до 767 CSS-пикселей) используется исходный размер схемы с горизонтальной прокруткой при необходимости, на более широких — масштабирование по ширине. В меню можно вручную переключить режим для конкретной схемы. Заголовок экспортируется и в самостоятельный SVG.

## Выравнивание карточки и зазоры стрелок

Корневое свойство `"align": "left"` размещает карточку у левого края статьи. Также доступны `center` и `right`. Без этого свойства статические схемы центрируются, а интерактивные занимают всю ширину. Явное выравнивание сохраняет естественную ширину карточки в пределах статьи. Внутреннее `body.align` по-прежнему управляет компоновкой элементов, а не карточкой. Свойство `gap` у связи задаёт зазор между её концами и блоками в единицах SVG (0–24). По умолчанию стрелки имеют зазор 5; линии без наконечника — 0. На коротких участках зазор автоматически уменьшается.

Во вкладке «Исходник» доступен полный Markdown-блок; в меню можно скопировать его. Примеры схем приведены на английском, текст руководства и интерфейс локализованы.
