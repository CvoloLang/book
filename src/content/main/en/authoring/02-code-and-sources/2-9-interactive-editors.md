# 2.9 Interactive editors

Change field types and names, add, remove, and reorder fields. Size, alignment, padding and the declaration update automatically. Move `Value` to the top: the size in this model changes from 12 to 8 bytes.

## Structure editor

```diagram
{
  "title": "Structure layout editor",
  "width": 730,
  "caption": "Natural alignment model. Actual ABI and compiler rules may differ.",
  "controls": [
    {
      "kind": "fields",
      "id": "fields",
      "label": "Structure fields",
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
        "title": "Physical layout",
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
        "title": "Structure declaration",
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

## Format

The `fields` control declares `id`, `label`, `types`, `default` and optional `maxFields` (1–12, default 8). Each type declares `name`, `size`, `alignment` and optional HEX `color`. Initial rows contain `name` and `type`. Type sizes are author-defined, not compiler-derived.

- `$fields` resolves the current rows into sized, aligned fields for `$layout`.
- `$fieldCode` generates field declaration lines.
- Ordering by alignment is an illustrative heuristic, not a compiler optimization pass.

SVG downloads reflect the current state. The Markdown source retains author defaults. CLI `all` uses the initial list; explicit JSON state can export a modified list.
