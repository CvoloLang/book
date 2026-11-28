# 2.8 Step-by-step visualizations

The `steps` control presents an ordered sequence of states. Readers can navigate using arrows or select a specific step. Unlike ordinary tabs, the order of steps is meaningful.

## Ownership transfer

```diagram
{
  "title": "Ownership transfer",
  "width": 650,
  "caption": {
    "$switch": "step",
    "cases": {
      "before": "The resource belongs to first.",
      "transfer": "The transfer is an illustrative step, not an intermediate runtime state.",
      "after": "The resource now belongs to second. first no longer owns it."
    }
  },
  "controls": [
    {
      "kind": "steps",
      "id": "step",
      "label": "Step",
      "options": [
        {
          "label": "Before move",
          "value": "before"
        },
        {
          "label": "Transfer",
          "value": "transfer"
        },
        {
          "label": "After move",
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
                "before": "Owner",
                "transfer": "Transferring",
                "after": "Moved"
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
                "before": "Not an owner",
                "transfer": "Receiving",
                "after": "New owner"
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
        "title": "Resource",
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

## Format

`steps` uses the same `id`, `label`, `options` and `default` as `tabs`. Use `$switch` to change labels, elements, styles and edges for each step. SVG export captures the selected step, while `all` exports every finite variant. Diagrams are declarative and do not execute Cvolo code.
