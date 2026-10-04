# Chapter 13. Errors, `catch`, and `defer`

Cvolo keeps ordinary recoverable failure in the value/control-flow model instead of requiring a classic exception runtime. Result-shaped values describe whether an operation succeeded, while `try` / `catch` provides structured syntax for consuming that flow. `defer` handles deterministic cleanup at lexical scope boundaries.

The goal in this chapter is practical source code: how to express success, failure, cleanup, and recovery. The compiler-side lowering and zero-cost reasoning are intentionally moved to the **Advanced** book.

## 13.1 Result-based error flow

A fallible operation can return a result-shaped value and let the caller decide how failure should propagate or be handled.

```cvolo
val result = ReadValue();

switch (result) {
    case Ok value:
        Consume(value);
        break;

    case Err error:
        Report(error);
        break;
}
```

`try` / `catch` is the structured form for the same kind of recoverable flow when explicit result plumbing would obscure the operation itself.

## 13.2 `defer`

`defer` schedules cleanup at lexical-scope exit.

```cvolo
int fd = Open();
defer { Close(fd); }

Use(fd);
```

The cleanup runs when the surrounding scope exits, including exits caused by `return`, `break`, or handled failure paths.

## 13.3 `try`, `catch`, and `finally`

```cvolo
try {
    int value = ReadValue();
    Consume(value);
}
catch (ReadError.NotFound error) {
    HandleNotFound(error);
}
finally {
    FinishAttempt();
}
```

Use `catch` to handle a matching failure and `finally` for cleanup that belongs to the whole structured operation rather than only one lexical sub-scope.

> [!NOTE]
> This chapter focuses on source-level behavior. The explicit result checks, dispatch slots, cleanup ordering, and zero-cost motivation are covered in [Advanced: how `try/catch/finally` is lowered](../advanced/06-try-catch-lowering.md).
