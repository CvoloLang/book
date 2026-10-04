# `Result<T, E>`

Use `Result<T, E>` when an operation either produces a value or a typed error.

```cvolo
[Result]
public union Result<T, E> {
    T Ok;
    E Err;
}
```

```cvolo
Result<int, ParseError> Parse(string text) {
    // ...
}
```

`try`/`catch` can provide structured syntax over result-shaped error flow.
