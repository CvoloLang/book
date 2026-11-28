# 2.9 Интерактивные редакторы

Меняйте типы и имена полей, добавляйте, удаляйте и переставляйте их. Размер, выравнивание, padding и объявление структуры пересчитываются автоматически. Переместите `Value` вверх: размер в этой модели изменится с 12 до 8 байт.

## Редактор структуры

```diagram
{
  "title": "Редактор расположения структуры в памяти",
  "width": 730,
  "caption": "Модель естественного выравнивания. Реальные правила ABI и компилятора могут отличаться.",
  "controls": [
    {
      "kind": "fields",
      "id": "fields",
      "label": "Поля структуры",
      "maxFields": 8,
      "types": [
        {
          "name": "byte",
          "size": 1,
          "alignment": 1,
          "color": "#3478cf"
        },
        {
          "name": "short",
          "size": 2,
          "alignment": 2,
          "color": "#0891b2"
        },
        {
          "name": "int",
          "size": 4,
          "alignment": 4,
          "color": "#188b40"
        },
        {
          "name": "long",
          "size": 8,
          "alignment": 8,
          "color": "#9333ea"
        }
      ],
      "default": [
        {
          "name": "Kind",
          "type": "byte"
        },
        {
          "name": "Value",
          "type": "int"
        },
        {
          "name": "Flags",
          "type": "byte"
        }
      ]
    }
  ],
  "data": {
    "layoutFields": {
      "$fields": "fields"
    }
  },
  "body": {
    "kind": "column",
    "gap": 15,
    "children": [
      {
        "kind": "row",
        "gap": 12,
        "children": [
          {
            "kind": "metric",
            "title": "Size",
            "code": {
              "$format": "bytes",
              "value": {
                "$layout": {
                  "$ref": "layoutFields"
                },
                "pick": "size"
              }
            },
            "width": 190,
            "style": {
              "valueSize": 25
            }
          },
          {
            "kind": "metric",
            "title": "Alignment",
            "code": {
              "$format": "bytes",
              "value": {
                "$layout": {
                  "$ref": "layoutFields"
                },
                "pick": "alignment"
              }
            },
            "width": 190,
            "style": {
              "valueSize": 25
            }
          },
          {
            "kind": "metric",
            "title": "Padding",
            "code": {
              "$format": "bytes",
              "value": {
                "$layout": {
                  "$ref": "layoutFields"
                },
                "pick": "padding"
              }
            },
            "width": 190,
            "style": {
              "valueSize": 25
            }
          }
        ]
      },
      {
        "kind": "divider",
        "width": 640
      },
      {
        "kind": "memory-layout",
        "title": "Физическое расположение",
        "width": 640,
        "segments": {
          "$layout": {
            "$ref": "layoutFields"
          },
          "pick": "segments"
        }
      },
      {
        "kind": "divider",
        "width": 640
      },
      {
        "kind": "node",
        "title": "Объявление структуры",
        "width": 640,
        "code": {
          "$concat": [
            "struct Entry\n{\n",
            {
              "$fieldCode": "fields"
            },
            "\n}"
          ]
        },
        "style": {
          "textAlign": "start",
          "fillOpacity": 0.03,
          "fontSize": 15
        }
      }
    ]
  }
}
```

## Формат

Контрол `fields` объявляет `id`, `label`, `types`, `default` и необязательный `maxFields` (1–12, по умолчанию 8). Каждый тип задаёт `name`, `size`, `alignment` и необязательный HEX `color`. Начальный список содержит объекты `name` и `type`. Размеры типов задаются автором, а не определяются компилятором.

- `$fields` преобразует текущий список в поля с размером и выравниванием для `$layout`.
- `$fieldCode` генерирует строки объявлений полей.
- Упорядочивание по выравниванию — учебная эвристика, а не проход оптимизации компилятора.

SVG в меню экспортирует текущее состояние. Исходник Markdown сохраняет авторские начальные значения. CLI `all` использует начальный список, а явный JSON состояния позволяет экспортировать изменённый список.
