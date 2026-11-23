# 4.2 Enums

Enumerations (`enum`) let you define types with a predefined set of named values. They are useful when a program needs to distinguish between several states, modes, or categories.

Imagine a program that processes tasks. A task can be waiting to start, running, or completed. We could represent these states with numbers, but a value such as `1` does not clearly convey its meaning. An enumeration gives each state a meaningful name.

## Declaring an Enumeration

To declare an enumeration, use the `enum` keyword. Follow it with the new type's name and list its variants inside curly braces:

```cvolo
enum TaskState
{
    Pending,
    Running,
    Completed
}
```

`TaskState` is the name of the declared type. It has three variants:

- `Pending` - the task is waiting to start;
- `Running` - the task is in progress;
- `Completed` - the task has finished.

A value of an ordinary enumeration represents **only one of its declared variants**. Variants do not have their own fields: each is a named value associated with an integer code.

If you do not specify numeric values when declaring an enumeration, the compiler assigns them automatically, starting at `0`:

| Variant | Numeric value |
| --- | ---: |
| `TaskState.Pending` | `0` |
| `TaskState.Running` | `1` |
| `TaskState.Completed` | `2` |

> **Important:** An enumeration must declare at least one variant. Variant names cannot be repeated within the same declaration.

## Using an Enumeration

To refer to a variant, write the enumeration name, a dot, and the desired variant's name - for example, `TaskState.Pending`.

Let's declare a variable named `state` to hold the task's current state. Because the state may change, we'll use `var`:

```cvolo tab="Inferred type"
var state = TaskState.Pending;

state = TaskState.Running;
state = TaskState.Completed;
```

```cvolo tab="Explicit type"
var TaskState state = TaskState.Pending;

state = TaskState.Running;
state = TaskState.Completed;
```

In the first example, the compiler infers the variable's type from `TaskState.Pending`. In the second, the type `TaskState` is specified explicitly. Both forms are equivalent, and `var` allows the variable to be assigned a new value.

You can check the task's current state with a condition:

```cvolo
if (state == TaskState.Completed)
{
    // The task has finished.
}
```

Although variants are represented by numbers, `TaskState` remains a distinct type. For example, assigning an integer directly is not allowed:

```cvolo
TaskState state = 1; // Error: int cannot be implicitly converted to TaskState.
```

This **does not mean that all conversions are forbidden**. Cvolo supports explicit casts, which we'll examine below.

## Numeric Values and Underlying Type

You can assign numeric values to variants yourself. For example, task states might need to match codes used by an external system:

```cvolo
enum TaskState : byte
{
    Pending = 1,
    Running = 5,
    Completed
}
```

If a variant has no explicit value, it receives the value immediately after the preceding variant's value. Here, `Completed` therefore corresponds to `6`.

The `: byte` notation specifies the type used to store the numeric codes. If no underlying type is specified, the default is `int`. Supported types are `int`, `uint`, `short`, `ushort`, `long`, `ulong`, `char`, `byte`, and `sbyte`.

Explicitly assigned values must be known at compile time. Integer constants and supported expressions involving previously declared variants are allowed.

You can explicitly convert an enumeration value to an integer:

```cvolo
int code = (int)TaskState.Running;
```

You can also explicitly convert an integer to an enumeration, but not every integer corresponds to a declared variant. In safe code, the compiler therefore compares the number against the variants' numeric values. If it finds a match, the result contains the corresponding variant; otherwise, the result indicates that no matching value exists. For the declaration above, `5` corresponds to `TaskState.Running`, while `10` matches no variant.

The expression `(TaskState)code` has the type `Option<TaskState>`: it produces `Some` when a match exists and `None` when it does not. We'll explore `Option<T>` in detail in the later [article about `Option<T>`](../06-optional-values/6-1-option.md).

## Using Enumerations in `switch`

When different states require different actions, `switch` is a convenient choice:

```cvolo
using System;

void PrintState(TaskState state)
{
    switch (state)
    {
        case Pending:
            Console.WriteLine("Waiting to start");
        case Running:
            Console.WriteLine("Running");
        case Completed:
            Console.WriteLine("Completed");
    }
}
```

Inside `switch`, variant names are written without the `TaskState.` prefix because the compiler already knows the type of the value being examined. Only the selected branch executes: **there is no automatic fallthrough to the next `case`**, so you do not need to end each branch with `break`.

For an ordinary enumeration, the compiler checks that the `switch` handles every variant. To provide a fallback, you can use either `default` or `case _`:

```cvolo
switch (state)
{
    case Pending:
        // Waiting to start.
    default:
        // All other states.
}
```

Both forms define a fallback branch. They also let you avoid listing every variant individually.

For more about `switch`, see [Section 3.4, "The `switch` Statement"](../03-control-flow/3-4-switch.md).

## Enumeration Information

The compiler provides several built-in ways to inspect an enumeration. For example:

```cvolo
enum Level : byte
{
    Easy = 1,
    Normal = 2,
    Hard = 4
}
```

An enumeration value has a `Name()` method that returns the name of its current variant. You can also access information through the type name: `Count` (the number of variants), `Min` and `Max` (the smallest and largest numeric values), and `Values` (a read-only slice containing the variant values).

Select a tab to see each feature in use and the resulting console output. All examples use the `Level` type declared above.

```cvolo tab="Variant name"
using System;

int main()
{
    Level level = Level.Normal;
    Console.WriteLine(level.Name());
    return 0;
}
```

```output
Normal
```

```cvolo tab="Count, Min, and Max"
using System;

int main()
{
    Console.WriteLine(Level.Count);
    Console.WriteLine(Level.Min);
    Console.WriteLine(Level.Max);
    return 0;
}
```

```output
3
1
4
```

```cvolo tab="Values"
using System;

int main()
{
    for (int i = 0; i < Level.Values.Length; i = i + 1)
    {
        Level current = Level.Values[i];
        Console.WriteLine(current.Name());
    }

    return 0;
}
```

```output
Easy
Normal
Hard
```

All of these features are supplied by the compiler: you do not need to declare `Name()`, `Count`, `Min`, `Max`, or `Values` yourself.

## Flag Enumerations

Sometimes a value needs to represent **several independent properties at once**. For example, a user may have both read and write permissions. An ordinary enumeration selects a single variant; to combine flags, Cvolo provides the `[Flags]` attribute:

```cvolo
[Flags]
enum Permissions : byte
{
    None,
    Read,
    Write,
    Execute
}
```

The attribute changes how numeric values are assigned automatically:

- `None` - `0`, an empty set of flags;
- `Read` - `1`, the first bit;
- `Write` - `2`, the second bit;
- `Execute` - `4`, the third bit.

Each nonzero flag occupies a separate bit, so you can combine flags with the `|` operator and test them with `HasFlag()`.

```cvolo tab="Inferred types"
val access = Permissions.Read | Permissions.Write;
val canWrite = access.HasFlag(Permissions.Write);
```

```cvolo tab="Explicit types"
Permissions access = Permissions.Read | Permissions.Write;
bool canWrite = access.HasFlag(Permissions.Write);
```

In both examples, `canWrite` is `true` because `access` contains the `Write` flag. The `&`, `^`, and `~` operators are also supported. The `~` operator is restricted to the mask of declared individual flags.

Additional rules apply to `[Flags]`:

- The underlying type must be unsigned: `uint`, `ushort`, `ulong`, `byte`, or `char`.
- If a variant has the numeric value `0`, its name must be `None`, `Empty`, `Unset`, or `Zero`. Declaring a zero-valued variant is optional.
- `Count` and `Values` include only individual nonzero flags, excluding the zero-valued variant and any composite variants.

A `switch` over `[Flags]` does not have to list every variant because flags can be combined. However, if no branch matches at runtime and there is no `default`, the program terminates abnormally. A fallback branch is therefore particularly useful here.

The general rules for applying attributes will be covered in a separate [article, "Attributes"](4-15-attributes.md).

## Enumerations with `[NonExhaustive]`

Imagine an enumeration declared in one file and used elsewhere in a project. A new variant might be added later. If other code assumes that the current list of variants will never change, such an addition would require reviewing the corresponding `switch` statements.

The `[NonExhaustive]` attribute warns about this possibility ahead of time and requires code in other files to provide a fallback branch.

```cvolo tab="TaskState.cvl"
[NonExhaustive]
enum TaskState
{
    Pending,
    Running,
    Completed
}
```

```cvolo tab="Main.cvl"
using System;

void PrintState(TaskState state)
{
    switch (state)
    {
        case Pending:
            Console.WriteLine("Waiting to start");
        case Running:
            Console.WriteLine("Running");
        case Completed:
            Console.WriteLine("Completed");
        default:
            Console.WriteLine("Unknown state");
    }
}
```

All three currently known states are handled, but `default` is **still required** because `TaskState` is declared in another file and marked `[NonExhaustive]`. For example, a future version might add `Cancelled`, and the fallback branch would already be available.

In the file that declares the enumeration, the usual exhaustive-`switch` rule applies: handling all known variants is sufficient, or you can provide a `default` branch.

Importantly, the attribute **does not let other files add variants to the enumeration**. It only changes the compiler's requirements for handling that enumeration. In the current version of Cvolo, the check distinguishes compilation units (files), not package boundaries.

## What's Next

We now know how to declare enumerations and use their variants. But sometimes each variant needs to carry its own data. In the next article, we'll introduce unions (`union`).