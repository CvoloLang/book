# 1.1 Hello World

A hosted Cvolo program can use the standard library through `System`. The smallest console program is:

```cvolo
using System;

int main() {
    Console.WriteLine("Hello, Cvolo!");
    return 0;
}
```

## What happens here

- `using System;` connects the `System` standard-library surface to this source file and lets you use names such as `Console` without spelling the full `System.Console` prefix.
- `int main()` is the entry point of an executable target.
- `Console.WriteLine(...)` writes a line to the console.
- In `main`, `return 0;` returns process exit code `0` to the host environment. In an ordinary function, `return` simply returns a value to the caller.

## Program output

```cvolo
using System;

int main() {
    Console.WriteLine("Hello, Cvolo!");
    return 0;
}
```

```output
Hello, Cvolo!
```
