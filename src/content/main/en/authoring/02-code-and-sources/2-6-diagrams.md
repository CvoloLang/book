# Declarative diagrams

A `diagram` fence renders a JSON description as a vector illustration. It supports nested containers, memory cells, variable states and connections. Rendering takes place on the server; no browser graphics engine is required. The embedded figure follows the Book Cvolo theme.

Download a standalone SVG in either light or dark colors below each diagram. Reference the saved file in ordinary Markdown: `![Description](diagram-light.svg)`.

## Examples

### Stack and heap

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

### Array and slice

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

### Ownership transfer

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

### Operation sequence

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

## Format

The fence contains strict JSON without comments or trailing commas. The root requires a `body` element and optionally accepts `title`, `caption` and an `edges` array.

| `kind` | Purpose |
| --- | --- |
| `row` | Horizontal children |
| `column` | Vertical children |
| `group` | Framed container with a title and vertical layout |
| `node` | Box with title, code or description |
| `cells` | Contiguous row of rectangular `node` cells |
| `text` | Unframed text |
| `space` | Empty alignment space |

Common fields: `id` (unique edge anchor), `title` (bold text), `code` (monospace), `text` (description), `tone` (semantic color), `moved` (dashed border and struck-through code), `width`, `height` (minimum SVG units), `gap` (child spacing), `align` (`start`, `center`, `end` on the cross-axis), and `children`.

Tones: `neutral`, `owner` (violet), `read` (blue), `write` (amber), `success` (green), `error` (red). Edges require `from` and `to` IDs, optionally `tone`, `fromSide`, `toSide` (`top`, `right`, `bottom`, `left`). The engine searches for short orthogonal routes between boxes. If no route is found, increase the `gap` or explicitly choose sides. Crossings between multiple edges are not optimized yet. Text widths are estimated without relying on installed fonts.

Example source:

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

## Command-line export

```bash
npm run diagrams:export -- path/to/article.md ./images both
```

The command extracts every `diagram` block into separate SVG files. A JSON file containing a single diagram is also accepted. Use `light` or `dark` instead of `both` to export one variant.

Run `npm run diagrams:test` for tests. Invalid properties, duplicate IDs and missing edge targets produce diagnostics at build time. Wide diagrams scroll horizontally on mobile so labels remain readable.

First-version limits: 60 elements, 40 edges, 10 nesting levels; no interactive graphs, animations or fully automatic layout of arbitrary graphs. Use explicit rows, columns and gaps for complex figures.
