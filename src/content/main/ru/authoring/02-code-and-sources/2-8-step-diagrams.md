# 2.8 Пошаговые визуализации

Контрол `steps` позволяет показать последовательность состояний. Читатель переключает шаги стрелками или выбирает конкретный шаг в списке. В отличие от обычных вкладок, порядок шагов имеет значение.

## Передача владения

```diagram
{
  "title": "Передача владения",
  "width": 650,
  "caption": {
    "$switch": "step",
    "cases": {
      "before": "Ресурс принадлежит first.",
      "transfer": "Передача владения показана как отдельный учебный шаг, а не промежуточное состояние выполнения.",
      "after": "Теперь ресурс принадлежит second. first больше не владеет ресурсом."
    }
  },
  "controls": [
    {
      "kind": "steps",
      "id": "step",
      "label": "Шаг",
      "options": [
        {
          "label": "До перемещения",
          "value": "before"
        },
        {
          "label": "Передача",
          "value": "transfer"
        },
        {
          "label": "После перемещения",
          "value": "after"
        }
      ],
      "default": "before"
    }
  ],
  "body": {
    "kind": "column",
    "gap": 64,
    "children": [
      {
        "kind": "row",
        "gap": 100,
        "children": [
          {
            "kind": "node",
            "id": "first",
            "code": "first",
            "text": {
              "$switch": "step",
              "cases": {
                "before": "Владелец",
                "transfer": "Передаёт ресурс",
                "after": "Перемещено"
              }
            },
            "tone": {
              "$switch": "step",
              "cases": {
                "before": "owner",
                "transfer": "owner",
                "after": "neutral"
              }
            },
            "moved": {
              "$switch": "step",
              "cases": {
                "before": false,
                "transfer": false,
                "after": true
              }
            },
            "width": 220
          },
          {
            "kind": "node",
            "id": "second",
            "code": "second",
            "text": {
              "$switch": "step",
              "cases": {
                "before": "Не владеет",
                "transfer": "Получает ресурс",
                "after": "Новый владелец"
              }
            },
            "tone": {
              "$switch": "step",
              "cases": {
                "before": "neutral",
                "transfer": "owner",
                "after": "owner"
              }
            },
            "moved": false,
            "width": 220
          }
        ]
      },
      {
        "kind": "node",
        "id": "resource",
        "title": "Ресурс",
        "tone": "owner",
        "width": 300
      }
    ]
  },
  "edges": {
    "$switch": "step",
    "cases": {
      "before": [
        {
          "from": "first",
          "to": "resource",
          "fromSide": "bottom",
          "toSide": "top"
        }
      ],
      "transfer": [
        {
          "from": "first",
          "to": "second",
          "fromSide": "right",
          "toSide": "left",
          "label": "Move"
        },
        {
          "from": "first",
          "to": "resource",
          "fromSide": "bottom",
          "toSide": "top",
          "style": {
            "dashed": true
          }
        }
      ],
      "after": [
        {
          "from": "second",
          "to": "resource",
          "fromSide": "bottom",
          "toSide": "top"
        }
      ]
    }
  }
}
```

## Формат

`steps` использует те же `id`, `label`, `options` и `default`, что и `tabs`. Выражение `$switch` позволяет менять подписи, элементы, стили и связи на каждом шаге. Экспорт SVG сохраняет выбранный шаг, а `all` экспортирует все конечные варианты. Схема декларативна и не исполняет код Cvolo.
