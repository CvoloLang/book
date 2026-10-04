# Lowering и семантика `foreach`

## Source forms

Поддерживаются формы:

```cvolo
foreach (val item in collection) { }
foreach (var item in collection) { }
foreach (refvar item in collection) { }
foreach (int item in collection) { }
```

`refvar` с explicit item type не является основной формой; mutable-reference item type выводится из `Current`/элемента коллекции.

## Binding contract

- `var item` — detached mutable local copy;
- `refvar item` — mutable reference непосредственно к element storage;
- mutable reference допустима только если source предоставляет mutable reference permission;
- loop-reference не должен escape lexical body boundary.

## Lowering phase

`foreach` должен сохраняться до binding, чтобы body-scoped constructs (`defer`, lifetimes и reference permissions) анализировались в корректном lexical context.

После binding arrays/slices могут быть переписаны dedicated lowering pass в индексный цикл. Structural enumerator path может сохранять семантические stamps до codegen.

## Arrays и slices

Для `T[N]`, `ref T[]` и `refvar T[]` lowering использует cached-length index loop без enumerator object.

Концептуально:

```cvolo
foreach (val item in values) {
    Body(item);
}
```

становится:

```cvolo
val int __len = values.Length;

for (var int __i = 0; __i < __len; __i++) {
    val item = values[__i];
    Body(item);
}
```

Fixed-size array может использовать compile-time literal bound вместо runtime `Length` load.

Для `refvar` binding:

```cvolo
refvar item = ref values[__i];
```

должен сохранять direct mutation semantics.

## Structural enumerator path

Пользовательский type считается iterable, если доступен structural sequence:

```text
GetEnumerator()
  -> enumerator
       bool MoveNext()
       Current
```

Visibility rules применяются так же, как к обычным вызовам. Недоступный `GetEnumerator` не удовлетворяет contract.

## Borrow contract target collection

На время активного iteration collection identifier имеет immutable structural borrow. Операции, которые могут изменить topology/reallocate storage и инвалидировать iteration, должны быть отклонены.

## Observable guarantee

Array/slice path не должен требовать allocation enumerator object. Structural path должен сохранять permissions `Current`, включая невозможность получить `refvar` из value-only/read-only current.
