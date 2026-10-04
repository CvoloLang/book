# Chapter 4. Conditions and loops

Control flow in Cvolo is deliberately familiar: conditions are explicit `bool` expressions, loops keep their lexical scope, and `break` / `continue` make exits visible in source. The interesting part is not learning unusual syntax, but understanding where higher-level constructs such as `foreach` still compile down to predictable control flow.

This chapter stays at the source-language level. The exact compiler model for iteration is covered later in the **Advanced** book.

## 4.1 `if` and `else`

Use `if` when control flow depends on a Boolean expression.

```cvolo
if (ready) {
    Start();
}
else {
    Wait();
}
```

Conditions must already have type `bool`; Cvolo does not treat arbitrary integers or references as implicit truth values.

## 4.2 Loops

Cvolo provides `while`, `for`, and `foreach`.

```cvolo
var int index = 0;

while (index < 4) {
    Console.WriteLine($"{index}");
    index++;
}
```

A counted loop keeps initialization, condition, and step together:

```cvolo
for (var int i = 0; i < 4; i++) {
    Console.WriteLine($"{i}");
}
```

And `foreach` expresses element-by-element iteration directly:

```cvolo
foreach (val item in values) {
    Consume(item);
}
```

For arrays and slices this high-level form can still become a direct indexed loop. See [How `foreach` is lowered](../advanced/05-foreach-lowering.md).
