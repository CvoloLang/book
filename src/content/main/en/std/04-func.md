# S1.5 `Func<T..., R>`

`Func<T..., R>` is a generic `System` delegate for callables that return a value. The final generic argument is the result type; earlier arguments describe parameters.

```cvolo
using System;

int Square(int value) {
    return value * value;
}

Func<int, int> square = Square;
int result = square(6);
```

With multiple parameters:

```cvolo
Func<int, int, int> add = Add;
```

This represents a callable shaped like `(int, int) -> int`.

Use a named delegate when a public API benefits from a domain-specific contract name.
