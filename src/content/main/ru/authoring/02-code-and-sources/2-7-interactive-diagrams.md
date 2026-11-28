# 2.7 Интерактивные визуализации

Параметры и вычисления изменяют схему без перезагрузки страницы. Выбранное состояние экспортируется в SVG. Это учебные модели, а не результаты запуска компилятора.

## Галерея

### Специализация типа

```diagram
{
  "title": {
    "$concat": [
      "Entity<Player, ",
      { "$var": "history" },
      ">"
    ]
  },
  "caption": "Illustrative model: Player is 8 B, long is 8 B, uint is 4 B. Actual ABI depends on the target.",
  "width": 730,
  "controls": [
    {
      "kind": "tabs",
      "id": "history",
      "label": "History",
      "options": [
        { "label": "true", "value": "true" },
        { "label": "false", "value": "false" }
      ],
      "default": "true"
    },
    {
      "kind": "tabs",
      "id": "view",
      "label": "View",
      "options": [
        { "label": "Memory layout", "value": "layout" },
        { "label": "Fields", "value": "fields" },
        { "label": "Code", "value": "code" }
      ],
      "default": "layout"
    }
  ],
  "data": {
    "fields": {
      "$switch": "history",
      "cases": {
        "true": [
          { "name": "LastModified", "size": 8, "alignment": 8, "tone": "success" },
          { "name": "Health", "size": 4, "alignment": 4, "tone": "read" },
          { "name": "Damage", "size": 4, "alignment": 4, "tone": "read" },
          { "name": "Version", "size": 4, "alignment": 4, "tone": "write" }
        ],
        "false": [
          { "name": "Health", "size": 4, "alignment": 4, "tone": "read" },
          { "name": "Damage", "size": 4, "alignment": 4, "tone": "read" }
        ]
      }
    },
    "size": {
      "$layout": { "$ref": "fields" },
      "pick": "size"
    },
    "alignment": {
      "$layout": { "$ref": "fields" },
      "pick": "alignment"
    },
    "padding": {
      "$layout": { "$ref": "fields" },
      "pick": "padding"
    }
  },
  "body": {
    "kind": "column",
    "children": [
      {
        "kind": "row",
        "children": [
          {
            "kind": "metric",
            "title": "Size",
            "code": {
              "$format": "bytes",
              "value": { "$ref": "size" }
            },
            "tone": "neutral",
            "width": 180,
            "style": { "valueSize": 25 }
          },
          {
            "kind": "metric",
            "title": "Alignment",
            "code": {
              "$format": "bytes",
              "value": { "$ref": "alignment" }
            },
            "tone": "neutral",
            "width": 180,
            "style": { "valueSize": 25 }
          },
          {
            "kind": "metric",
            "title": "Padding",
            "code": {
              "$format": "bytes",
              "value": { "$ref": "padding" }
            },
            "tone": "neutral",
            "width": 180,
            "style": { "valueSize": 25 }
          }
        ],
        "gap": 20
      },
      { "kind": "divider", "width": 640, "height": 12 },
      {
        "$switch": "view",
        "cases": {
          "layout": {
            "kind": "memory-layout",
            "title": "PHYSICAL LAYOUT",
            "width": 640,
            "scale": 25,
            "segments": {
              "$layout": { "$ref": "fields" },
              "pick": "segments"
            }
          },
          "fields": {
            "kind": "table",
            "widths": [
              110,
              340,
              150
            ],
            "rows": {
              "$switch": "history",
              "cases": {
                "true": [
                  [
                    "Offset",
                    "Field",
                    "Size"
                  ],
                  [
                    0,
                    "LastModified",
                    "8 B"
                  ],
                  [
                    8,
                    "Health",
                    "4 B"
                  ],
                  [
                    12,
                    "Damage",
                    "4 B"
                  ],
                  [
                    16,
                    "Version",
                    "4 B"
                  ],
                  [
                    20,
                    "Padding",
                    "4 B"
                  ]
                ],
                "false": [
                  [
                    "Offset",
                    "Field",
                    "Size"
                  ],
                  [
                    0,
                    "Health",
                    "4 B"
                  ],
                  [
                    4,
                    "Damage",
                    "4 B"
                  ]
                ]
              }
            }
          },
          "code": {
            "kind": "node",
            "title": "Illustrative expansion",
            "width": 640,
            "code": {
              "$switch": "history",
              "cases": { "true": "long LastModified;\nPlayer Data;\nuint Version;", "false": "Player Data;" }
            },
            "style": { "fontSize": 15, "fillOpacity": 0.03 }
          }
        }
      },
      { "kind": "divider", "width": 640, "height": 12 },
      { "kind": "text", "text": "CONDITIONAL COMPOSITION" },
      {
        "kind": "row",
        "children": [
          {
            "kind": "node",
            "title": "Version",
            "width": 300,
            "text": {
              "$switch": "history",
              "cases": { "true": "✓ History = true", "false": "Excluded" }
            },
            "tone": {
              "$switch": "history",
              "cases": { "true": "success", "false": "neutral" }
            },
            "style": { "fillOpacity": 0.05 }
          },
          {
            "kind": "node",
            "title": "LastModified",
            "width": 300,
            "text": {
              "$switch": "history",
              "cases": { "true": "✓ History = true", "false": "Excluded" }
            },
            "tone": {
              "$switch": "history",
              "cases": { "true": "success", "false": "neutral" }
            },
            "style": { "fillOpacity": 0.05 }
          }
        ],
        "gap": 12
      }
    ],
    "gap": 13
  }
}
```

### Размер, выравнивание и padding

```diagram
{
  "title": "Structure layout optimization",
  "width": 730,
  "caption": {
    "$concat": [
      "Assuming the size and alignment of ",
      { "$var": "type" },
      " are ",
      { "$ref": "typeSize" },
      " B. ",
      "Natural-alignment model."
    ]
  },
  "controls": [
    {
      "kind": "tabs",
      "id": "type",
      "label": "Value field type",
      "options": [
        { "label": "byte", "value": "byte" },
        { "label": "short", "value": "short" },
        { "label": "int", "value": "int" },
        { "label": "long", "value": "long" }
      ],
      "default": "int"
    },
    { "kind": "slider", "id": "count", "label": "Element count", "min": 1000, "max": 1000000, "step": 1000, "default": 1000000 }
  ],
  "data": {
    "typeSize": {
      "$switch": "type",
      "cases": { "byte": 1, "short": 2, "int": 4, "long": 8 }
    },
    "before": [
      {
        "name": "K",
        "size": 1,
        "alignment": 1,
        "tone": "read",
        "style": { "fill": "#3478cf", "fillOpacity": 0.95, "textColor": "#ffffff", "radius": 4 }
      },
      {
        "name": "Value",
        "size": { "$ref": "typeSize" },
        "alignment": { "$ref": "typeSize" },
        "tone": "success",
        "style": { "fill": "#188b40", "fillOpacity": 0.95, "textColor": "#ffffff", "radius": 4 }
      },
      {
        "name": "F",
        "size": 1,
        "alignment": 1,
        "tone": "write",
        "style": { "fill": "#bf740c", "fillOpacity": 0.95, "textColor": "#ffffff", "radius": 4 }
      }
    ],
    "after": [
      {
        "name": "Value",
        "size": { "$ref": "typeSize" },
        "alignment": { "$ref": "typeSize" },
        "tone": "success",
        "style": { "fill": "#188b40", "fillOpacity": 0.95, "textColor": "#ffffff", "radius": 4 }
      },
      {
        "name": "K",
        "size": 1,
        "alignment": 1,
        "tone": "read",
        "style": { "fill": "#3478cf", "fillOpacity": 0.95, "textColor": "#ffffff", "radius": 4 }
      },
      {
        "name": "F",
        "size": 1,
        "alignment": 1,
        "tone": "write",
        "style": { "fill": "#bf740c", "fillOpacity": 0.95, "textColor": "#ffffff", "radius": 4 }
      }
    ],
    "beforeSize": {
      "$layout": { "$ref": "before" },
      "pick": "size"
    },
    "afterSize": {
      "$layout": { "$ref": "after" },
      "pick": "size"
    },
    "beforeBytes": {
      "$op": "mul",
      "args": [
        { "$ref": "beforeSize" },
        { "$var": "count" }
      ]
    },
    "afterBytes": {
      "$op": "mul",
      "args": [
        { "$ref": "afterSize" },
        { "$var": "count" }
      ]
    },
    "saved": {
      "$op": "sub",
      "args": [
        { "$ref": "beforeBytes" },
        { "$ref": "afterBytes" }
      ]
    },
    "ratio": {
      "$op": "div",
      "args": [
        { "$ref": "saved" },
        { "$ref": "beforeBytes" }
      ]
    },
    "scale": {
      "$switch": "type",
      "cases": { "byte": 100, "short": 88, "int": 48, "long": 24 }
    }
  },
  "body": {
    "kind": "column",
    "children": [
      {
        "kind": "memory-layout",
        "title": {
          "$concat": [
            "Original layout · ",
            {
              "$format": "bytes",
              "value": { "$ref": "beforeSize" }
            }
          ]
        },
        "width": 640,
        "scale": { "$ref": "scale" },
        "segments": {
          "$layout": { "$ref": "before" },
          "pick": "segments"
        }
      },
      {
        "kind": "memory-layout",
        "title": {
          "$concat": [
            "Optimized layout · ",
            {
              "$format": "bytes",
              "value": { "$ref": "afterSize" }
            }
          ]
        },
        "width": 640,
        "scale": { "$ref": "scale" },
        "segments": {
          "$layout": { "$ref": "after" },
          "pick": "segments"
        }
      },
      {
        "kind": "row",
        "children": [
          {
            "kind": "node",
            "title": "Kind",
            "width": 140,
            "height": 42,
            "style": { "color": "#3478cf", "fillOpacity": 0.16, "fontSize": 14 }
          },
          {
            "kind": "node",
            "title": "Value",
            "width": 140,
            "height": 42,
            "style": { "color": "#188b40", "fillOpacity": 0.16, "fontSize": 14 }
          },
          {
            "kind": "node",
            "title": "Flags",
            "width": 140,
            "height": 42,
            "style": { "color": "#bf740c", "fillOpacity": 0.16, "fontSize": 14 }
          },
          {
            "kind": "node",
            "title": "Padding",
            "width": 140,
            "height": 42,
            "style": { "color": "#71717a", "fillOpacity": 0.16, "fontSize": 14 }
          }
        ],
        "gap": 8
      },
      { "kind": "divider", "width": 640, "height": 12 },
      {
        "kind": "bar",
        "title": {
          "$concat": [
            "Before: ",
            {
              "$format": "mib",
              "value": { "$ref": "beforeBytes" }
            }
          ]
        },
        "value": { "$ref": "beforeBytes" },
        "max": { "$ref": "beforeBytes" },
        "width": 640,
        "style": { "fill": "#3478cf" }
      },
      {
        "kind": "bar",
        "title": {
          "$concat": [
            "After: ",
            {
              "$format": "mib",
              "value": { "$ref": "afterBytes" }
            }
          ]
        },
        "value": { "$ref": "afterBytes" },
        "max": { "$ref": "beforeBytes" },
        "width": 640,
        "style": { "fill": "#188b40" }
      },
      { "kind": "divider", "width": 640, "height": 12 },
      {
        "kind": "row",
        "children": [
          {
            "kind": "metric",
            "title": "Memory savings",
            "code": {
              "$format": "percent",
              "value": { "$ref": "ratio" }
            },
            "tone": "success",
            "width": 180,
            "style": { "valueSize": 25, "textColor": "#16a34a" }
          },
          {
            "kind": "metric",
            "title": "Array savings",
            "code": {
              "$format": "mb",
              "value": { "$ref": "saved" }
            },
            "tone": "neutral",
            "width": 180,
            "style": { "valueSize": 25 }
          }
        ],
        "gap": 52
      }
    ],
    "align": "start",
    "gap": 12
  }
}
```

### AoS / SoA

```diagram
{
  "title": "Particle data organization",
  "width": 730,
  "caption": "Illustrative equal-sized fields. Highlighting indicates the processed field, not guaranteed speedup.",
  "controls": [
    {
      "kind": "tabs",
      "id": "storage",
      "label": "View",
      "options": [
        { "label": "AoS", "value": "aos" },
        { "label": "SoA", "value": "soa" }
      ],
      "default": "aos"
    },
    {
      "kind": "tabs",
      "id": "field",
      "label": "Processed field",
      "options": [
        { "label": "X", "value": "X" },
        { "label": "Y", "value": "Y" },
        { "label": "Z", "value": "Z" },
        { "label": "Velocity", "value": "Velocity" }
      ],
      "default": "X"
    }
  ],
  "body": {
    "kind": "column",
    "children": [
      {
        "kind": "text",
        "text": {
          "$switch": "storage",
          "cases": { "aos": "Array of Structures (AoS)", "soa": "Structure of Arrays (SoA)" }
        },
        "style": { "fontSize": 17 }
      },
      {
        "kind": "grid",
        "columns": 4,
        "gap": 6,
        "children": {
          "$switch": "storage",
          "cases": {
            "aos": [
              {
                "kind": "node",
                "title": "X[0]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Y[0]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Z[0]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Velocity[0]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "X[1]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Y[1]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Z[1]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Velocity[1]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "X[2]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Y[2]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Z[2]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Velocity[2]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "X[3]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Y[3]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Z[3]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Velocity[3]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              }
            ],
            "soa": [
              {
                "kind": "node",
                "title": "X[0]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "X[1]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "X[2]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "X[3]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Y[0]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Y[1]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Y[2]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Y[3]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Z[0]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Z[1]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Z[2]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Z[3]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Velocity[0]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Velocity[1]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Velocity[2]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "kind": "node",
                "title": "Velocity[3]",
                "width": 142,
                "height": 42,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              }
            ]
          }
        }
      },
      { "kind": "divider", "width": 640, "height": 12 },
      { "kind": "text", "text": "Physical order" },
      {
        "kind": "memory-layout",
        "scale": 36,
        "width": 640,
        "segments": {
          "$switch": "storage",
          "cases": {
            "aos": [
              {
                "name": "X",
                "bytes": 1,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Y",
                "bytes": 1,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Z",
                "bytes": 1,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Velocity",
                "bytes": 1,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "X",
                "bytes": 1,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Y",
                "bytes": 1,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Z",
                "bytes": 1,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Velocity",
                "bytes": 1,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "X",
                "bytes": 1,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Y",
                "bytes": 1,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Z",
                "bytes": 1,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Velocity",
                "bytes": 1,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "X",
                "bytes": 1,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Y",
                "bytes": 1,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Z",
                "bytes": 1,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Velocity",
                "bytes": 1,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              }
            ],
            "soa": [
              {
                "name": "X",
                "bytes": 1,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "X",
                "bytes": 1,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "X",
                "bytes": 1,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "X",
                "bytes": 1,
                "style": {
                  "color": "#2563eb",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.75, "Y": 0.12, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Y",
                "bytes": 1,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Y",
                "bytes": 1,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Y",
                "bytes": 1,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Y",
                "bytes": 1,
                "style": {
                  "color": "#0891b2",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.75, "Z": 0.12, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Z",
                "bytes": 1,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Z",
                "bytes": 1,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Z",
                "bytes": 1,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Z",
                "bytes": 1,
                "style": {
                  "color": "#0d9488",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.75, "Velocity": 0.12 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Velocity",
                "bytes": 1,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Velocity",
                "bytes": 1,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Velocity",
                "bytes": 1,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              },
              {
                "name": "Velocity",
                "bytes": 1,
                "style": {
                  "color": "#9333ea",
                  "fillOpacity": {
                    "$switch": "field",
                    "cases": { "X": 0.12, "Y": 0.12, "Z": 0.12, "Velocity": 0.75 }
                  },
                  "fontSize": 14,
                  "radius": 5
                }
              }
            ]
          }
        }
      },
      {
        "kind": "text",
        "text": {
          "$switch": "storage",
          "cases": { "aos": "Selected fields are separated by other structure fields.", "soa": "Selected fields are contiguous in a separate array." }
        },
        "width": 640
      }
    ],
    "gap": 14
  }
}
```

### Матрицы

```diagram
{
  "title": "Matrix multiplication",
  "width": 730,
  "caption": "Inner dimensions must match: 3 × 4 times 4 × 2 gives 3 × 2.",
  "body": {
    "kind": "row",
    "children": [
      {
        "kind": "column",
        "children": [
          {
            "kind": "grid",
            "columns": 4,
            "gap": 5,
            "children": [
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#2563eb", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#2563eb", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#2563eb", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#2563eb", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#2563eb", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#2563eb", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#2563eb", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#2563eb", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#2563eb", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#2563eb", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#2563eb", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#2563eb", "fillOpacity": 0.2, "radius": 6 }
              }
            ]
          },
          {
            "kind": "text",
            "title": "3 × 4",
            "style": { "fontSize": 21 }
          }
        ],
        "gap": 14
      },
      {
        "kind": "text",
        "title": "×",
        "style": { "fontSize": 28 }
      },
      {
        "kind": "column",
        "children": [
          {
            "kind": "grid",
            "columns": 2,
            "gap": 5,
            "children": [
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#d97706", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#d97706", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#d97706", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#d97706", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#d97706", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#d97706", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#d97706", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#d97706", "fillOpacity": 0.2, "radius": 6 }
              }
            ]
          },
          {
            "kind": "text",
            "title": "4 × 2",
            "style": { "fontSize": 21 }
          }
        ],
        "gap": 14
      },
      {
        "kind": "text",
        "title": "=",
        "style": { "fontSize": 28 }
      },
      {
        "kind": "column",
        "children": [
          {
            "kind": "grid",
            "columns": 2,
            "gap": 5,
            "children": [
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#16a34a", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#16a34a", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#16a34a", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#16a34a", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#16a34a", "fillOpacity": 0.2, "radius": 6 }
              },
              {
                "kind": "node",
                "title": "",
                "width": 45,
                "height": 45,
                "style": { "color": "#16a34a", "fillOpacity": 0.2, "radius": 6 }
              }
            ]
          },
          {
            "kind": "text",
            "title": "3 × 2",
            "style": { "fontSize": 21 }
          }
        ],
        "gap": 14
      }
    ],
    "gap": 24
  }
}
```

### Архитектура

```diagram
{
  "title": "Application architecture",
  "width": 730,
  "body": {
    "kind": "column",
    "children": [
      {
        "kind": "node",
        "title": "Svelte 5 UI",
        "id": "ui",
        "text": "Shared pages and components",
        "width": 390,
        "style": { "color": "#a855f7", "fillOpacity": 0.12, "fontSize": 17 }
      },
      {
        "kind": "node",
        "title": "Repositories / API Client",
        "id": "api",
        "text": "Unified API contract",
        "width": 430,
        "style": { "color": "#64748b", "fillOpacity": 0.12, "fontSize": 17 }
      },
      {
        "kind": "row",
        "children": [
          {
            "kind": "column",
            "children": [
              {
                "kind": "node",
                "title": "Local Dev API",
                "id": "local",
                "text": "npm run dev",
                "width": 275,
                "style": { "color": "#0ea5e9", "fillOpacity": 0.12 }
              },
              { "kind": "node", "title": "Fixtures", "id": "fixtures", "text": "Test fixtures\nPlaywright / VRT", "width": 275 }
            ],
            "gap": 32
          },
          {
            "kind": "column",
            "children": [
              {
                "kind": "node",
                "title": "ASP.NET Core",
                "id": "prod",
                "text": "npm run dev:api",
                "width": 275,
                "style": { "color": "#16a34a", "fillOpacity": 0.12 }
              },
              { "kind": "node", "title": "PostgreSQL / Redis", "id": "db", "text": "MQTT / BenchAgent\nReal hardware", "width": 275 }
            ],
            "gap": 32
          }
        ],
        "gap": 28,
        "align": "start"
      }
    ],
    "gap": 40
  },
  "edges": [
    {
      "from": "ui",
      "to": "api",
      "tone": "neutral",
      "arrow": false,
      "fromSide": "bottom",
      "toSide": "top",
      "style": { "strokeWidth": 2 }
    },
    {
      "from": "api",
      "to": "local",
      "tone": "neutral",
      "arrow": false,
      "fromSide": "bottom",
      "toSide": "top",
      "style": { "strokeWidth": 2 }
    },
    {
      "from": "api",
      "to": "prod",
      "tone": "neutral",
      "arrow": false,
      "fromSide": "bottom",
      "toSide": "top",
      "style": { "strokeWidth": 2 }
    },
    {
      "from": "local",
      "to": "fixtures",
      "tone": "neutral",
      "arrow": false,
      "fromSide": "bottom",
      "toSide": "top",
      "style": { "strokeWidth": 2 }
    },
    {
      "from": "prod",
      "to": "db",
      "tone": "neutral",
      "arrow": false,
      "fromSide": "bottom",
      "toSide": "top",
      "style": { "strokeWidth": 2 }
    }
  ]
}
```

### Ветвление

```diagram
{
  "title": "Constraint Evaluator",
  "caption": "Three possible constraint evaluation results.",
  "width": 730,
  "body": {
    "kind": "column",
    "children": [
      { "kind": "node", "title": "Constraint Evaluator", "id": "eval", "text": "Evaluate where expression", "width": 380 },
      {
        "kind": "row",
        "children": [
          { "kind": "node", "title": "✓ Satisfied", "id": "yes", "text": "Constraint satisfied", "tone": "success", "width": 200 },
          { "kind": "node", "title": "✕ Unsatisfied", "id": "no", "text": "Constraint is false", "tone": "error", "width": 200 },
          { "kind": "node", "title": "! Invalid", "id": "invalid", "text": "Evaluation error", "tone": "write", "width": 200 }
        ],
        "gap": 15
      }
    ],
    "gap": 58
  },
  "edges": [
    { "from": "eval", "to": "yes", "tone": "neutral", "arrow": false, "fromSide": "bottom", "toSide": "top" },
    { "from": "eval", "to": "no", "tone": "neutral", "arrow": false, "fromSide": "bottom", "toSide": "top" },
    { "from": "eval", "to": "invalid", "tone": "neutral", "arrow": false, "fromSide": "bottom", "toSide": "top" }
  ]
}
```

### Множества типов

```diagram
{
  "title": "Type set",
  "caption": "Illustrative type contract, not a compiler conformance check.",
  "width": 730,
  "body": {
    "kind": "group",
    "title": "All Cvolo types",
    "width": 660,
    "children": [
      {
        "kind": "row",
        "children": [
          {
            "kind": "ellipse",
            "title": "NetworkData",
            "tone": "success",
            "style": { "fillOpacity": 0.07 },
            "children": [
              {
                "kind": "grid",
                "columns": 2,
                "gap": 10,
                "children": [
                  {
                    "kind": "node",
                    "title": "int",
                    "tone": "success",
                    "width": 110,
                    "style": { "fillOpacity": 0.14 }
                  },
                  {
                    "kind": "node",
                    "title": "Position",
                    "tone": "success",
                    "width": 110,
                    "style": { "fillOpacity": 0.14 }
                  },
                  {
                    "kind": "node",
                    "title": "Header",
                    "tone": "success",
                    "width": 110,
                    "style": { "fillOpacity": 0.14 }
                  },
                  {
                    "kind": "node",
                    "title": "PlayerDto",
                    "tone": "success",
                    "width": 110,
                    "style": { "fillOpacity": 0.14 }
                  }
                ]
              }
            ]
          },
          {
            "kind": "column",
            "children": [
              { "kind": "node", "title": "Texture", "text": "Resource", "tone": "error", "width": 140 },
              { "kind": "node", "title": "LargeData", "text": "Too large", "tone": "error", "width": 140 }
            ],
            "gap": 35
          }
        ],
        "gap": 22
      }
    ]
  }
}
```

### Владение между потоками

```diagram
{
  "title": "Ownership transfer across threads",
  "caption": "A resource transfer model, not shared access.",
  "width": 730,
  "body": {
    "kind": "row",
    "children": [
      {
        "kind": "group",
        "title": "Thread A",
        "tone": "read",
        "width": 270,
        "children": [
          {
            "kind": "node",
            "title": "Moved",
            "id": "moved",
            "width": 205,
            "style": { "dashed": true, "fillOpacity": 0.035 }
          },
          { "kind": "space", "height": 32 }
        ]
      },
      {
        "kind": "group",
        "title": "Thread B",
        "tone": "success",
        "width": 270,
        "children": [
          { "kind": "node", "title": "Texture", "id": "texture", "tone": "success", "width": 205 },
          { "kind": "text", "text": "New owner" }
        ]
      }
    ],
    "gap": 104
  },
  "edges": [
    {
      "from": "moved",
      "to": "texture",
      "fromSide": "right",
      "toSide": "left",
      "label": "Move",
      "tone": "success",
      "style": { "strokeWidth": 2.5 }
    }
  ]
}
```

### Карточка диагностики

```diagram
{
  "title": "Future diagnostic example",
  "width": 730,
  "caption": "Diagnostic concept, not actual Cvolo output.",
  "body": {
    "kind": "group",
    "tone": "neutral",
    "width": 650,
    "style": { "fillOpacity": 0.08 },
    "children": [
      {
        "kind": "text",
        "title": "Packet payload must not exceed 1024 bytes",
        "style": { "textColor": "#ef4444", "fontSize": 17 }
      },
      {
        "kind": "node",
        "code": "main.cvl:42:9\nvar Packet<LargeData> packet;\n^^^^^^^^^^^^^^^^^^^^^",
        "width": 600,
        "style": { "fontSize": 14, "strokeOpacity": 0, "fillOpacity": 0.05 }
      },
      { "kind": "divider", "width": 600, "height": 12 },
      { "kind": "text", "text": "Actual payload size: 2048 bytes\nRequired maximum: 1024 bytes\nConstraint declared in Packet.cvl:6", "width": 600 }
    ]
  }
}
```

## Формат интерактивности

`controls` объявляет до шести параметров: `tabs` — явно выделенные варианты, `select` — список, `slider` — ползунок с `min`, `max`, `step`, `default`. Варианты содержат `label` и `value` (строку или число). `data` хранит именованные вычисления и значения. Автор задаёт данные, а не исполняемый JavaScript.

| Выражение | Назначение |
| --- | --- |
| `{"$var":"count"}` | Значение параметра |
| `{"$ref":"bytes"}` | Значение из data |
| `{"$switch":"type","cases":{...}}` | Выбор по параметру |
| `{"$op":"mul","args":[a,b]}` | add, sub, mul, div, min, max |
| `{"$format":"bytes","value":n}` | bytes, kib, mib, mb, percent, number |
| `{"$concat":[a,b]}` | Соединение строк |
| `{"$layout":[...],"pick":"segments"}` | Расчёт выравнивания; pick: segments, size, alignment, padding |

В `$layout` поля описываются `name`, `size`, `alignment`, необязательными `tone` и `style`. Порядок полей сохраняется, внутренний и конечный padding вычисляются автоматически. Сравнивайте layout при одинаковом количестве SVG-единиц на байт (`scale`). Модель не исполняет компилятор и не учитывает специальные правила ABI, packing или оптимизацию Cvolo.

### Пример исходного блока

````markdown
```diagram
{
  "title": "Array memory",
  "controls": [
    { "kind": "slider", "id": "count", "label": "Count",
      "min": 1, "max": 100, "step": 1, "default": 10 }
  ],
  "data": {
    "bytes": { "$op": "mul", "args": [{ "$var": "count" }, 4] }
  },
  "body": {
    "kind": "bar",
    "title": { "$format": "bytes", "value": { "$ref": "bytes" } },
    "value": { "$var": "count" },
    "max": 100,
    "width": 360,
    "style": { "fill": "#3478CF", "fillOpacity": 0.9 }
  }
}
```
````

## Новые примитивы

- `memory-layout`: `segments` из объектов `name`, `bytes`, `tone`, `style`, `padding`; ширина сегмента пропорциональна числу байт. `scale` задаёт единицы SVG на байт.
- `grid`: `columns` и `children`, компоновка по строкам.
- `table`: `rows` (строки и числа) и `widths` (минимальные ширины колонок).
- `metric`: крупное значение в `code` и подпись в `title`.
- `bar`: числовые `value`, `max`, название через `title`.
- `divider`: горизонтальная линия.
- `ellipse`: контейнер-множество с дочерними элементами.

## Экспорт

Кнопки SVG в меню «⋯» обновляются при изменении параметров. Для экспорта из командной строки:

```bash
npm run diagrams:export -- article.md ./images both all
npm run diagrams:export -- diagram.json ./images dark '{"count":10000}'
npm run diagrams:html -- article.md ./visuals.html ru
```

`all` перебирает конечные варианты (до 48 комбинаций), оставляя слайдеры в значениях по умолчанию. JSON параметров предназначен для одной схемы с соответствующими параметрами. SVG сохраняет только выбранное состояние. HTML включает схемы, стили и интерактивный код для локального открытия без Book и сетевых запросов.

## Ограничения

Текст измеряется приближённо; длинные подписи могут потребовать большей ширины. Пересечения отдельных стрелок и подписей не оптимизируются полностью. Таблицы и сетки используют общий движок. Слайдеры не исполняют код. Будущий редактор полей структуры может использовать `computeMemoryLayout` из `model.ts`; редактирование полей пока не входит в текущий формат.

Заголовок и меню «⋯» находятся в шапке карточки и не прокручиваются вместе с графикой. На мобильных экранах (до 767 CSS-пикселей) используется исходный размер схемы с горизонтальной прокруткой при необходимости, на более широких — масштабирование по ширине. В меню можно вручную переключить режим для конкретной схемы. Заголовок экспортируется и в самостоятельный SVG.

Во вкладке «Исходник» можно посмотреть полный Markdown-блок каждой визуализации. При возврате в «Просмотр» выбранные параметры сохраняются. Независимый движок расположен в `packages/visuals`.
