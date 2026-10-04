# Глава 5. Функции

Функции в Cvolo объявляются глобально или внутри namespace. Параметры по умолчанию доступны только для чтения, а способ передачи значения виден в сигнатуре.

## 5.1 Объявление и вызов функций

```cvolo
int Add(int a, int b) {
    return a + b;
}
```

Вызов:

```cvolo
int result = Add(10, 20);
```

Если функция возвращает не `void`, все пути выполнения должны завершаться `return`.

## 5.2 Параметры и способы передачи

### Параметры по значению

Параметр без дополнительных модификаторов передаётся по значению и внутри функции read-only.

```cvolo
void PrintCount(int count) {
    Console.WriteLine($"count = {count}");
    // count++; // нельзя
}
```

Если нужна изменяемая локальная копия параметра, используйте `var`:

```cvolo
void Normalize(var int value) {
    if (value < 0) value = 0;
}
```

### `ref` и `refvar`

`ref` передаёт read-only ссылку без копирования объекта. `refvar` разрешает функции изменять исходное значение.

```cvolo
struct Counter {
    int Value;
}

void Print(ref Counter counter) {
    Console.WriteLine($"{counter.Value}");
}

void Increment(refvar Counter counter) {
    counter.Value += 1;
}
```

Ссылки Cvolo не являются nullable в safe-коде. Пустое состояние моделируется через `Option<T>`.

## 5.3 Возвращаемые значения и тип результата

Тип результата записывается перед именем функции. Это не обязательно примитив: функция может возвращать обычное значение, пользовательский тип, optional/result-значение, generic-параметр или ссылку.

### Обычное значение

Самый частый случай — функция возвращает значение типа `T` через `return`:

```cvolo
int Add(int a, int b) {
    return a + b;
}

Point MakePoint(int x, int y) {
    return Point { X: x, Y: y };
}
```

Для value-return действуют обычные правила типа: trivial-значение копируется, а move-тип передаёт владение результатом вызывающему коду.

### `void`: результата нет

`void` используется, когда функция выполняет действие, но не выдаёт значение:

```cvolo
void Log(string message) {
    Console.WriteLine(message);
}
```

`void` — именно отсутствие результата функции, а не обычное значение, которое следует хранить в переменной.

### Optional-результат: `Option<T>` и `T?`

Если значение может отсутствовать, это лучше выразить в типе результата:

```cvolo
int? FindIndex(ref int[] values, int target) {
    for (var int i = 0; i < values.Length; i++) {
        if (values[i] == target) {
            return i;
        }
    }

    return Option.None;
}
```

`T?` является сокращением для `Option<T>`. Такой API заставляет вызывающий код явно обработать случай, когда результата нет.

### Ошибка как часть результата: `Result<T, E>`

Операция, которая может завершиться ожидаемой ошибкой, может вернуть `Result<T, E>`:

```cvolo
Result<int, ParseError> ParseNumber(string text) {
    // ...
}
```

`Result<T, E>` — тип из Base SDK, а не отдельный вид функции. Его обработка через `catch` и `try / catch` рассматривается в главе об ошибках.

Для функции без полезного success-значения можно использовать result-shape с `void`, например `Result<void, E>`.

### Возврат ссылки: `ref T` и `refvar T`

Функция может возвращать ссылку явно:

```cvolo
ref Point ChooseFirst(ref Point first, ref Point second) {
    return ref first;
}
```

Возвращаемая ссылка должна продолжать жить после выхода из функции. Поэтому безопасно возвращать ссылку, происходящую из параметра или global-объекта, но нельзя вернуть ссылку на локальную переменную:

```cvolo
ref Point Invalid() {
    Point local = Point { X: 1, Y: 2 };
    return ref local; // ошибка: local исчезнет при выходе из функции
}
```

Для `refvar` действует то же lifetime-требование, а дополнительно сохраняется правило единственной изменяемой ссылки.

### Generic-результат

Тип результата может зависеть от generic-параметра:

```cvolo
T Identity<T>(T value) {
    return value;
}
```

Поэтому в сигнатуре `T Function(...)` на месте `T` может стоять не только конкретный встроенный тип, но и параметр типа.

### Все пути должны вернуть результат

Если результат не `void`, каждый путь выполнения обязан завершиться подходящим `return`:

```cvolo
int Sign(int value) {
    if (value < 0) {
        return -1;
    }

    if (value > 0) {
        return 1;
    }

    return 0;
}
```

Конструкторы — отдельный синтаксический случай: они не объявляют возвращаемый тип вообще. Их жизненный цикл рассматривается в следующей главе.

## 5.4 Обобщённые функции

Обобщённые функции используют параметры типа:

```cvolo
void Process<T>(T value) {
    // код для конкретного T материализуется при использовании
}
```

Ограничения записываются через `where`:

```cvolo
void Run<T>(T operation, int a, int b)
    where T : delegate<int, int> {
    int result = operation(a, b);
}
```

## 5.5 Associated functions

Расширения поддерживают receiverless-функции с ведущей точкой. Они принадлежат типу, но не получают `this`.

```cvolo
public extension Layout {
    public Layout .FromType<T>() {
        return Layout(
            sizeof<T>(),
            alignof<T>()
        );
    }
}
```

Вызов выполняется через тип:

```cvolo
Layout info = Layout.FromType<int>();
```
