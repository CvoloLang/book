# `Option<T>` и `T?`

Используйте `Option<T>`, когда значение **может отсутствовать**, но код остаётся в safe-модели Cvolo. В safe и unbound коде отсутствие значения не представляется обычным nullable `ref T` и не требует сырого `null`.

`T?` — краткая форма записи `Option<T>`.

## Что такое `Option<T>`

Каноническая форма из Base — discriminated union с двумя состояниями:

```cvolo
public union Option<T> {
    T Some;
    void None;
}
```

Семантика проста:

- `Some` — значение присутствует;
- `None` — значения нет.

## Сокращение `T?`

Следующие объявления используют одну и ту же optional-модель:

```cvolo
Option<int> explicitOption;
int? shortOption;
```

Обычное значение можно присвоить `T?`: оно становится состоянием `Some`.

```cvolo
int? port = 8080;
string? name = "cvolo";
```

Пустое состояние записывается явно:

```cvolo
int? port = Option.None;
```

Raw `null` в safe-коде для этого не используется.

## Проверка значения

Option раскрывается pattern matching-ом:

```cvolo
int? FindPort(bool found) {
    if (found) {
        return 8080;
    }

    return Option.None;
}

switch (FindPort(true)) {
    case Some port:
        Console.WriteLine($"port = {port}");
        break;

    case None:
        Console.WriteLine("port not found");
        break;
}
```

Для move/reference payload полезно match-ить контейнер по ссылке, чтобы не перемещать его:

```cvolo
switch (ref node.next) {
    case Some nextNode:
        Console.WriteLine($"{nextNode.value}");
        break;

    case None:
        break;
}
```

## Optional references

Обычные safe references не nullable:

```cvolo
ref Node current = ref node;
```

Если ссылка сама должна отсутствовать, используется optional reference:

```cvolo
ref Node? next = Option.None;
```

Семантически это optional-состояние, а не ослабление правила non-null для `ref Node`.

## `default(T?)`

`default` optional-типа даёт пустое состояние:

```cvolo
int? value = default(int?);
```

По смыслу `value` находится в состоянии `None`.

## Когда используется `null`

Сырой `null` относится к hardware/ABI-модели и разрешён только для raw pointers в `unsafe`:

```cvolo
unsafe void Release(Node* ptr) {
    if (ptr == null) {
        return;
    }

    free(ptr);
}
```

Это отдельная модель от safe `Option<T>`.

> [!NOTE]
> Layout `Option<ref T>`, Null-Pointer Optimization, nested options и точные правила `T?` описаны в [продвинутом разборе option/nullability](../advanced/03-option-nullability.md).
