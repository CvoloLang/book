# `Option<T>` and `T?`

Use `Option<T>` when a value can be present or absent. `T?` is the concise form for the same optional-value model where the language permits it.

```cvolo
int? port = 8080;
int? missing = Option.None;
```

A canonical shape is:

```cvolo
public union Option<T> {
    T Some;
    void None;
}
```

This keeps absence explicit in safe code instead of treating every reference as nullable.
