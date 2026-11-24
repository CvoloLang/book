# 4.1 Structures

Structures (`struct`) let you create custom data types. Each structure type describes a set of fields that its instances will have.

Imagine a program that needs to work with the positions of objects on a plane. A position can be represented by a point with two coordinates, `X` and `Y`. To work with these coordinates together, we'll create a type called `Point`.

## Declaring a Structure

A structure is declared using the `struct` construct. The type name follows `struct`, and its fields are declared inside curly braces:

```cvolo
struct Point
{
    int X;
    int Y;
}
```

`Point` is the name of the declared type. The declarations `int X;` and `int Y;` define its fields: `int` specifies each field's type, while `X` and `Y` are their names. The values of these fields belong to a particular `Point` instance, not to the type declaration itself.

So far, we've only defined what a `Point` contains. We'll create an instance of this type in the next section.

Fields in the same structure can have different types. For example:

```cvolo
struct Player
{
    int Id;
    string Name;
    bool Active;
}
```

Each field declaration ends with a semicolon.

## Creating a Structure Instance

Let's create an instance of `Point` and store it in a variable named `point`:

```cvolo
var Point point = Point
{
    X = 10,
    Y = 20
};
```

Here's what each part means:

- `var` allows the variable to be reassigned.
- `Point`, to the left of `point`, is the variable's type.
- `point` is the variable's name.
- The `Point` initializer to the right of `=` creates a structure instance with the specified field values.

We use `var` here because we'll change the coordinates later. In Cvolo, a variable can also be declared without `var`: by default, it cannot be reassigned. However, preventing reassignment of a variable is not the same as preventing changes to its fields. We'll return to that distinction in the section on accessing fields.

Inside the curly braces, we provide the field values: `X` gets `10`, and `Y` gets `20`.

Field names identify which value belongs to which field. The order of fields in the initializer does not have to match their declaration order in `struct Point`. When initializing a structure this way in ordinary code, you must provide values for all its fields; omitting a field causes a compilation error.

### Two Ways to Specify Field Values

Inside curly braces, Cvolo supports two separators: `=` and `:`.

```cvolo
var Point first = Point
{
    X = 10,
    Y = 20
};

var Point second = Point
{
    X: 10,
    Y: 20
};
```

Both forms create a `Point` instance with the same field values. **The preferred separator inside curly braces is `=`**: it makes it immediately clear which values are assigned to the fields during initialization. The colon is also valid.

The compiler allows the two styles to be mixed, but using `=` consistently is preferable.

### Initialization with Parentheses

When declaring a variable, you can also use a shorter form:

```cvolo
var Point point(X: 10, Y: 20);
```

Here, the type `Point` appears only once, followed by field names and values inside parentheses. **Only `:` is supported in this form.** It resembles a call with named arguments (`X: 10`, `Y: 20`), but the structure's fields are initialized directly, without invoking a constructor.

Constructors provide another way to define an instance's initial state. Their declaration and use are covered in [4.11, “Constructors”](4-11-constructors.md).

## Accessing Fields

Use the dot operator to access a field of an instance:

```cvolo
int x = point.X;
int y = point.Y;
```

The `point` variable was declared with `var`, so we can change its fields:

```cvolo
point.X = 15;
point.Y = 25;
```

Now `point.X` is `15`, and `point.Y` is `25`.

**Declaring a variable without `var` prevents reassignment of the variable, but does not by itself prevent changes to the structure's fields.** For example:

```cvolo
Point target = Point
{
    X = 0,
    Y = 0
};

target.X = 10; // Allowed: the field can be modified.
```

To explicitly prevent changes to fields through a variable, use `val`:

```cvolo
val Point origin = Point
{
    X = 0,
    Y = 0
};

origin.X = 30; // Error: modifying a field through val is forbidden.
```

Value passing, mutability, and references are covered in [4.6, “Ownership, Copying, and Moving”](4-6-ownership.md) and [4.7, “References and Borrowing”](4-7-references.md).

## What's Next

Now we know how to declare structures, create their instances, and access their fields. In the next article, we'll introduce enumerations (`enum`).
