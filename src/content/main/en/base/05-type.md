# `Type`

`Type` is the Base descriptor returned by the `typeof(...)` language operator. `typeof` is language syntax; the value it produces has the `Type` declaration supplied by Base.

That means basic type metadata does not require `System`.

## Basic usage

```cvolo
Type integerType = typeof(int);
Type stringType = typeof(string);
```

`typeof(T)` does not construct a `T`. It returns a descriptor for the type itself.

## Always available

No `using System;` is required:

```cvolo
Type current = typeof(MyStruct);
```

Because `Type` belongs to Base, it also remains available in freestanding builds.

## Language syntax vs Base declaration

| Part | Defined by |
|---|---|
| `typeof(...)` | the language/compiler |
| `Type` | Base SDK |

This split lets the compiler own the semantics of `typeof` while exposing the result through a normal named Base type.
