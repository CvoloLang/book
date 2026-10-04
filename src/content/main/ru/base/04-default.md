# `default(T)`

Оператор `default(T)` создаёт default-значение типа `T`, когда для этого типа разрешена безопасная zero-initialization.

Используйте `default(T)` в следующих случаях:

- для числового/логического значения в нулевом состоянии;
- для trivial struct, если его default bit-pattern корректен;
- для `T?`, чтобы получить `Option.None`;
- внутри generic-кода, когда concrete `T` удовлетворяет ограничениям default-инициализации.

## Базовые примеры

```cvolo
int count = default(int);
bool ready = default(bool);
```

Для integer default-значение равно нулю, а для `bool` — `false`.

## Default для struct

Для trivial struct default даёт zero-initialized значение:

```cvolo
struct Point {
    int X;
    int Y;
}

Point p = default(Point);
```

После инициализации `p.X` и `p.Y` находятся в нулевом состоянии.

## Default для `Option<T>` / `T?`

```cvolo
int? value = default(int?);
```

Здесь результат — empty optional state (`None`).

## Ограничение для owning/resource types

`default(T)` не является универсальным способом «создать любой объект без конструктора». Для типа, который требует нетривиальной инициализации или владеет ресурсом, zero-initialization может быть запрещена.

```cvolo
// Концептуально: owning resource нельзя считать корректно созданным
// только потому, что его память заполнена нулями.
```

> [!TIP]
> Если тип имеет собственный жизненный цикл, конструктор или ресурсный invariant, используйте предусмотренный этим типом способ создания вместо `default(T)`.

## `default` и generic defaults — разные вещи

Оператор значения:

```cvolo
T value = default(T);
```

не следует путать с default generic parameter, задающим тип по умолчанию в generic declaration. Это две разные языковые возможности.
