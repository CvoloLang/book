# Chapter A2. How `foreach` is lowered

For arrays and slices, a `foreach` loop can lower to a direct indexed loop.

```cvolo
foreach (val item in values) {
    Consume(item);
}
```

Conceptually:

```cvolo
val int __length = values.Length;

for (var int __index = 0; __index < __length; __index++) {
    val item = values[__index];
    Consume(item);
}
```

This is why the high-level construct does not inherently require allocation or an iterator object for array/slice iteration. User-defined iterable types may use the iterator protocol instead.
