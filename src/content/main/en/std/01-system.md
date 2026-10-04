<!-- routes: h2 -->
# S1. System and the standard library

`System` is Cvolo's hosted standard-library layer on top of Base. It is not required for the language's fundamental semantics and is imported on demand.

## S1.1 Importing System

A root import connects the public `System` surface to the current source file:

```cvolo
using System;

int main() {
    Console.WriteLine("Hello, Cvolo!");
    return 0;
}
```

Qualified access remains valid without the import:

```cvolo
System.Console.WriteLine("Hello");
```

`using System;` does not automatically import every child namespace.

## S1.2 System.Console

`Console` belongs to the root `System` namespace and is available to hosted programs for console I/O.

```cvolo
using System;

Console.WriteLine("Cvolo");
```

`Console` is not part of Base, so Base-only/freestanding code must not depend on it.

## S1.3 Std vs Base

| Layer | Availability | Examples |
|---|---|---|
| Base | always | `Option<T>`, `Result<T,E>`, `Type`, compiler-known attributes |
| Std / System | import-driven | `System.Console`, `System.Math`, and other library namespaces |

Freestanding builds disable System resolution while keeping Base available.
