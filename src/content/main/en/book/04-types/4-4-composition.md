# 4.4 Type Composition

We already know how to declare structures (`struct`), enums (`enum`), and unions (`union`). These types can be used not only on their own but also **as parts of other types**. This way of organizing data is called **composition**.

For example, a structure can contain another structure as a field, and a union variant can hold a structure instance. This lets us describe more complex data using types we already know.

## A Structure Inside Another Structure

Suppose we need to represent a line segment on a plane. It has two points: a start and an end. We already learned to represent point coordinates with `Point` in [Section 4.1, "Structures"](4-1-structures.md).

```cvolo
struct Point
{
    int X;
    int Y;
}

struct Segment
{
    Point Start;
    Point End;
}
```

`Segment` declares two fields:

- `Start` - the starting point, of type `Point`;
- `End` - the ending point, also of type `Point`.

There is no need to declare the coordinates `X` and `Y` again: they are already defined in `Point`. Each `Segment` instance has its own start and end points.

### Creating an Instance with Nested Values

When creating a `Segment`, we need to initialize both fields. Because `Start` and `End` have type `Point`, we can initialize them without repeating the type name. Here is the preferred short form, followed by the full form:

```cvolo tab="Short form"
var segment = Segment
{
    Start = (X: 10, Y: 20),
    End = (X: 30, Y: 40)
};
```

```cvolo tab="Full form"
var segment = Segment
{
    Start = Point
    {
        X = 10,
        Y = 20
    },
    End = Point
    {
        X = 30,
        Y = 40
    }
};
```

Both forms create the same `Segment` value. In the shorter form, the compiler determines that the nested values are `Point` instances from the types of `Start` and `End`. The second tab shows the explicit form for comparison. **Inside parentheses, use `:`, not `=`.**

To access a coordinate inside a nested structure, chain field names using dots:

```cvolo
int x = segment.Start.X; // 10
int y = segment.End.Y;   // 40
```

Here, `segment.Start` is a field of type `Point`, and `.X` accesses its `X` coordinate.

Since `segment` was declared with `var`, its nested fields can also be modified:

```cvolo
segment.Start.X = 15;
```

The starting point's `X` coordinate is now `15`. We covered the basic mutability rules in the structures article; we'll discuss passing and copying compound values separately.

## Enums and Unions as Structure Fields

A structure field can also have an `enum` or `union` type. For example, we can describe a table cell with a position, contents, and a visual style.

```cvolo
enum CellStyle
{
    Normal,
    Highlighted
}

union CellValue
{
    int Number;
    string Text;
    void Empty;
}

struct Cell
{
    Point Position;
    CellValue Content;
    CellStyle Style;
}
```

The `Cell` structure contains three fields with different user-defined types:

- `Position` stores the cell's position using `Point`;
- `Content` stores one of the variants of `CellValue`;
- `Style` stores a value of the `CellStyle` enum.

Let's create a `Cell`. For `Position`, we can use the shorter form because its type, `Point`, is already known. We'll initialize the `union` variant in `Content` explicitly. The second tab shows the full form:

```cvolo tab="Short form"
var cell = Cell
{
    Position = (X: 2, Y: 3),
    Content = CellValue
    {
        Text = "Hello"
    },
    Style = CellStyle.Highlighted
};
```

```cvolo tab="Full form"
var cell = Cell
{
    Position = Point
    {
        X = 2,
        Y = 3
    },
    Content = CellValue
    {
        Text = "Hello"
    },
    Style = CellStyle.Highlighted
};
```

In the shorter form, the compiler infers `Point` from the `Position` field. For `Content`, we use the explicit `CellValue { Text = "Hello" }` form: initializing a `union` variant with contextual parentheses is not yet supported in the current compiler version.

In both examples, `Cell` **has all three fields at the same time**, but only one `Content` variant, `Text`, is active.

The usual rules still apply: use dots to access nested structure fields, compare enum values with their variants, and inspect union contents with `is` or `switch`.

For more on these variants, see [Section 4.2, "Enums"](4-2-enum.md) and [Section 4.3, "Unions"](4-3-union.md).

## A Structure Inside a Union Variant

Composition also works the other way around: a `union` variant can contain a structure.

For example, an object's location could be given either as coordinates or as the index of a point in an existing list:

```cvolo
union Location
{
    Point Coordinates;
    int Index;
}
```

Let's create a value with the `Coordinates` variant. The type of that variant's contents is known from the `Location` declaration, so we can also use the short form here:

```cvolo tab="Short form"
var location = Location
{
    Coordinates = (X: 5, Y: 10)
};
```

```cvolo tab="Full form"
var location = Location
{
    Coordinates = Point
    {
        X = 5,
        Y = 10
    }
};
```

To retrieve the coordinates, first check which variant is active:

```cvolo
if (location is Coordinates point)
{
    int x = point.X;
    int y = point.Y;
}
```

Inside the block, `point` has type `Point`, so its fields can be accessed normally. If `Index` is active, the condition is false. The list of points is stored outside `Location`: the union holds only an index, not the array itself.

> **Important:** Composition does not require declaring one type inside another. Types are usually declared separately and then used as parts of other types when they describe a distinct piece of data. For example, `Point` defines coordinates once, while `Segment` and `Cell` use it for their fields instead of declaring `X` and `Y` again.

## What's Next

In the next article, we'll explore [4.5, "Generic Types"](4-5-generics.md).
