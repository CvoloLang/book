# 4.5 Generic Types

Generics let you declare structures and functions **without tying them to specific data types in advance**. Instead of writing `int`, `string`, or another concrete type in a declaration, you use a **type parameter**. When using the structure or calling the function, you supply the type that takes the parameter's place.

This lets you write one declaration instead of several nearly identical ones. For example, without generics, a wrapper with a `Value` field would need separate declarations for numbers and strings. With generics, one declaration is enough.

## Declaring a Generic Structure

Suppose we want a simple type that stores one value, but we'd like to store values of different types in different parts of a program. Let's declare a generic structure named `Box<T>`:

```cvolo
struct Box<T>
{
    T Value;
}
```

Here's what each part means:

- `Box` - the structure's name;
- `<T>` - a list of **type parameters** enclosed in angle brackets. It makes the declaration generic;
- `T` - a type parameter that stands in for a concrete data type;
- `T Value;` - a field named `Value`, whose type is determined when `Box<T>` is used.

Here, `T` **represents a type, not a value**. We don't have to decide ahead of time whether `Value` will store an integer, a string, or another type.

The name `T` is a common convention, not a keyword. You can use another valid name, such as `TValue`.

## Using a Generic Type

When using the structure, provide a **type argument** - the concrete type to substitute for `T`:

```cvolo tab="Inferred type"
var number = Box<int>
{
    Value = 42
};

var message = Box<string>
{
    Value = "Hello"
};
```

```cvolo tab="Explicit type"
Box<int> number = Box<int>
{
    Value = 42
};

Box<string> message = Box<string>
{
    Value = "Hello"
};
```

In the first tab, the variable's type is inferred from the expression on the right side of `=`: you don't need to repeat `Box<int>` or `Box<string>` on the left. The second tab shows the equivalent explicit type declarations.

In `Box<int>`, `T` is replaced with `int`, so `Value` has type `int`. In `Box<string>`, `T` is replaced with `string`, so `Value` has type `string`.

Access the fields just as you would with an ordinary structure:

```cvolo
int answer = number.Value;
string text = message.Value;
```

**Important:** `Box<int>` and `Box<string>` are two different concrete types. Generics let you reuse the declaration, but **a single `Box<int>` instance cannot hold values of arbitrary types**. Likewise, an ordinary `Box<int>` array cannot contain `Box<string>` elements.

Don't confuse these two uses of angle brackets:

- `<T>` in the declaration `Box<T>` specifies a *type parameter*;
- `<int>` or `<string>` when using the structure provides a *type argument*.

## Multiple Type Parameters

A structure can have more than one type parameter. Separate them with commas:

```cvolo
struct Pair<T, U>
{
    T First;
    U Second;
}
```

Here, `T` determines the type of `First`, and `U` determines the type of `Second`. They do not have to be the same type.

```cvolo tab="Inferred type"
var item = Pair<int, string>
{
    First = 42,
    Second = "Answer"
};
```

```cvolo tab="Explicit type"
Pair<int, string> item = Pair<int, string>
{
    First = 42,
    Second = "Answer"
};
```

`item.First` has type `int`, and `item.Second` has type `string`. The order of type arguments matters: the first corresponds to `T`, and the second to `U`.

## Generic Unions

Not only structures but also unions (`union`) can be generic. A type parameter can determine the data type of a variant:

```cvolo
union LoadResult<T>
{
    T Data;
    string Error;
}
```

Now a successful load can contain different types of data:

```cvolo tab="Inferred type"
var number = LoadResult<int>
{
    Data = 42
};

var failure = LoadResult<string>
{
    Error = "File not found"
};
```

```cvolo tab="Explicit type"
LoadResult<int> number = LoadResult<int>
{
    Data = 42
};

LoadResult<string> failure = LoadResult<string>
{
    Error = "File not found"
};
```

In `LoadResult<int>`, the `Data` variant carries an `int`; in `LoadResult<string>`, the same variant carries a `string`. The `Error` variant carries a string in both cases.

You can handle the active variant with the techniques from [Section 4.3, "Unions"](4-3-union.md), such as `switch` or `is`.

## Generic Functions

Functions can also declare type parameters. They appear after the function name:

```cvolo
T Choose<T>(bool first, T a, T b)
{
    if (first)
    {
        return a;
    }

    return b;
}
```

Here, `T` appears in the types of parameters `a` and `b` and in the function's return type. When calling the function, we provide a concrete type argument:

```cvolo
var selected = Choose<int>(true, 10, 20);
var price = Choose<double>(false, 1.5, 2.5);
```

`selected` has type `int` and value `10`, while `price` has type `double` and value `2.5`. One function declaration serves both calls.

Generic methods in `extension` blocks are supported as well, but we'll discuss them in [Section 4.10, "Extension Blocks"](4-10-extension-blocks.md).

## Things to Keep in Mind

Generics do not disable type checking. For example, if a field is declared as `T Value`, then in `Box<int>` it must receive a value compatible with `int`:

```cvolo
var wrong = Box<int>
{
    Value = "forty-two" // Error: expected int, not string.
};
```

You also cannot assume that every type substituted for `T` supports every operation. Cvolo provides `where` constraints to specify which capabilities generic code may use. We'll cover these after [interfaces (Section 4.14)](4-14-interfaces.md) and [protocols (Section 4.15)](4-15-protocols.md).

## What's Next

Generic types let you reuse `struct` and `union` declarations with different type arguments. Creating, passing, and modifying their instances still follows the same ownership rules as other values.

In the next article, [4.6, "Ownership, Copying, and Moving"](4-6-ownership.md), we'll learn what happens when these values are passed between variables and functions.
