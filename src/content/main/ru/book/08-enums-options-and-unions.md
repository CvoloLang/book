# Глава 8. Enum, Option и алгебраические типы

Cvolo использует enum для ограниченного набора именованных значений и discriminated unions для состояний, которые несут разные payload-типы. Наиболее важный встроенный пример union — `Option<T>`.

## 8.1 Enum: хранение и флаги

### Enum

```cvolo
enum Status {
    Idle = 0,
    Active = 1,
    Failed = 2
}
```

Варианты scoped по умолчанию:

```cvolo
Status status = Status.Active;
```

Просто `Active` без имени enum не вводится в окружающую область видимости.

### Enum с фиксированным размером

Спецификация допускает явный underlying storage type для контроля layout.

```cvolo
enum Status : byte {
    Idle = 0,
    Active = 1,
    Failed = 2
}
```

Это особенно важно для ABI, бинарных форматов и компактных структур.

### `[Flags]`

Флаговый enum поддерживает безопасные побитовые комбинации.

```cvolo
[Flags]
enum Permissions : uint {
    None = 0,
    Read = 1,
    Write = 2,
    Execute = 4
}

var Permissions p = Permissions.Read | Permissions.Write;

if (p.HasFlag(Permissions.Write)) {
    Console.WriteLine("write enabled");
}
```

## 8.2 Optional-значения и nullability

### `Option<T>`

Пустое значение в safe-коде моделируется не через `null`, а через `Option<T>`:

```cvolo
union Option<T> {
    T Some;
    void None;
}
```

Например, значение либо присутствует, либо явно находится в состоянии `None`.

### Сокращение `T?`

Суффикс `?` — синтаксический сахар для `Option<T>`.

```cvolo
int? maybeCount = 10;
string? maybeName = Option.None;
```

Обычное значение автоматически оборачивается в `Some`, а `null` запрещён. Для пустого состояния используется `Option.None`.

> [!NOTE]
> Полное справочное определение `Option<T>` и `T?` находится в [справочнике Option](../base/02-option.md). Layout optional references и Null-Pointer Optimization вынесены в [спецификацию nullability](../advanced/03-option-nullability.md).

`void?` недопустим.

### Nullable references

`ref T` и `refvar T` сами по себе никогда не null. Опциональная ссылка выражается как `ref T?` или `Option<ref T>`.

```cvolo
ref Node? next = Option.None;
```

Для `Option<ref T>` компилятор может применять Null-Pointer Optimization: физически пустое состояние кодируется нулевым адресом, не делая `ref T` nullable на уровне безопасной семантики.

## 8.3 Pattern matching

Значение option раскрывается через `switch`:

```cvolo
switch (ref current.next) {
    case Some nextNode:
        Console.WriteLine($"{nextNode.value}");
        break;

    case None:
        Console.WriteLine("end");
        break;
}
```

Если match выполняется по `ref`, payload внутри `case` становится безопасной ссылкой на содержимое option без move контейнера.

## 8.4 Безопасные преобразования в enum

В safe-коде потенциально недопустимое число не превращается в enum без проверки: результат рассматривается как optional enum.

```cvolo
int raw = GetStatusCode();

switch ((Status)raw) {
    case Some value:
        Console.WriteLine(value.Name());
        break;
    case None:
        Console.WriteLine("unknown status");
        break;
}
```
