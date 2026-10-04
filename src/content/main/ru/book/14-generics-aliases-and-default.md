# Глава 14. Generics, type aliases и `default`

Обобщённый код позволяет писать алгоритмы и структуры без фиксации конкретного типа. Дополнительно Cvolo предлагает aliases и compile-time default/layout operators.

## 14.1 Generics и ограничения

### Generic type

```cvolo
struct Pair<T> {
    T First;
    T Second;
}
```

Использование:

```cvolo
Pair<int> pair = Pair<int> { First: 10, Second: 20 };
```

### Generic function

```cvolo
T Identity<T>(T value) {
    return value;
}
```

Generic-код специализируется для конкретных типов в соответствии с моделью monomorphization языка.

### Ограничения `where`

```cvolo
void Execute<T>(T op)
    where T : delegate<int, int> {
    int result = op(2, 3);
    Console.WriteLine($"{result}");
}
```

Contracts также могут участвовать в generic constraints.

## 14.2 Type aliases

`alias` создаёт альтернативное имя существующего типа и не меняет runtime layout.

```cvolo
alias UserId = ulong;
alias NodeRef<T> = Option<ref T>;
```

После binding alias прозрачен для type system:

```cvolo
UserId id = 100UL;
```

Alias не создаёт wrapper-структуру и не добавляет runtime overhead.

## 14.3 Значения по умолчанию

`default(T)` создаёт нулевое/default-состояние только для типов, для которых это безопасно по правилам языка.

```cvolo
int value = default(int);
```

Для resource move types такой default может быть запрещён, поскольку произвольное обнуление не всегда является корректно сконструированным состоянием.

Для optional type:

```cvolo
int? value = default(int?); // None
```

## 14.4 Generic-параметры по умолчанию

Generic declaration может задавать значение type parameter по умолчанию. Используйте эту возможность, когда тип по умолчанию естественен для API и не делает сигнатуру неоднозначной.

> [!NOTE]
> Сводка по допустимым случаям `default(T)` и его отличию от default generic parameters есть в [справочнике `default(T)`](../base/04-default.md).
