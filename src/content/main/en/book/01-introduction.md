# Chapter 1. Getting started

Cvolo is a compiled systems language with C#-like surface syntax and explicit rules for ownership, references, mutability, and cleanup. This chapter is the shortest useful route into the language: what an executable looks like, where the standard library comes from, and which rules are worth learning first.

The **Book** focuses on source code you write directly. Whenever a feature has a non-obvious compilation model or cost story, the chapter links to the **Advanced** book. Library primitives that are always available are documented under **Base**, while hosted APIs live under **Std / System**.

## 1.1 Hello World

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

## 1.2 Base and the standard library

Cvolo separates the always-present **Base SDK** from the hosted **System/std** layer. `Option<T>`, `Result<T, E>`, `Type`, and compiler-known attributes live in Base; console and other hosted APIs live in System.

```text
language syntax
    ↓
Base          always available
    ↓
Std / System  imported by hosted programs when needed
```

See the dedicated [Base](../../base/01-base.md) and [System](../../std/01-system.md) references for the exact split.
