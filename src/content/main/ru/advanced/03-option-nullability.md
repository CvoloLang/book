# Спецификация `Option<T>` и nullability

## Safe nullability

В safe и unbound zones отсутствие значения должно представляться через `Option<T>`. Safe references `ref T` и `refvar T` не являются nullable.

Канонический Base shape:

```cvolo
public union Option<T> {
    T Some;
    void None;
}
```

## `T?` desugaring

`T?` эквивалентен `Option<T>` на уровне type semantics.

```text
int?      => Option<int>
ref Node? => Option<ref Node>
```

Присваивание plain `T` в `T?` формирует `Some`. Empty state выражается через `Option.None`.

Literal `null` не должен использоваться как значение `T?` в safe-коде.

`void?` недопустим, поскольку `None` уже представляет отсутствие payload.

## `default(T?)`

`default(T?)` zero-initializes desugared `Option<T>` и должен давать состояние `None` при canonical Base layout.

## Optional references и NPO

Для `Option<ref T>` и `Option<refvar T>` реализация может применять Null-Pointer Optimization:

```text
Some(ref) => non-zero pointer
None      => zero pointer
```

При таком layout optional reference занимает один pointer-sized slot и не требует отдельного tag byte.

Это физическая оптимизация. На уровне safe semantics извлечённый `ref T` всё равно non-null.

## Nested options

Outer layers nested option не могут безусловно использовать тот же single-null-bit pattern, если он не способен различить все semantic states. Реализация должна сохранять однозначное различение состояний.

## Pattern matching by reference

При match по `ref` / `refvar` payload может быть promoted в ссылку на storage option без move контейнера:

```cvolo
switch (ref current.next) {
    case Some next:
        Use(next);
        break;
    case None:
        break;
}
```

Пока promoted reference активна, parent option storage не должен быть инвалидирован операцией, нарушающей borrow contract.

## Raw `null`

Hardware null допускается только для raw pointers в `unsafe`/ABI contexts. Safe Option и unsafe raw pointer являются разными семантическими моделями.
