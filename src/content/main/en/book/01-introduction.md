# Getting started

Cvolo is a compiled systems language with C#-like surface syntax and explicit rules for ownership, references, mutability, and cleanup. This public documentation snapshot intentionally starts small and keeps only the first runnable program.

## Hello World

A hosted Cvolo program can use the standard library through `System`. The smallest console program is:

```cvolo
using System;

int main() {
    Console.WriteLine("Hello, Cvolo!");
    return 0;
}
```

### What happens here

- `using System;` connects the `System` standard-library surface to this source file. It also lets you use names such as `Console` without spelling the full `System.Console` prefix.
- `int main()` is the entry point of an executable target.
- `Console.WriteLine(...)` writes a line to the console.
- In `main`, `return 0;` returns process exit code `0` to the host environment. In an ordinary function, `return` simply returns a value to the caller.

### A program without hosted APIs

The language itself and **Base** do not require `using System;`:

```cvolo
int main() {
    return 0;
}
```

That distinction matters for freestanding targets and for understanding which facilities are part of the language foundation versus the hosted standard library.
