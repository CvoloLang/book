# Глава 9. Ссылки, владение и безопасность памяти

Cvolo строит safe-код вокруг явного различия между значением, read-only borrow и mutable borrow. Ссылки не являются сырыми указателями и не могут быть `null`.

## 9.1 Borrowing: `ref`, `refvar` и aliasing

### `ref`: ссылка только для чтения

```cvolo
void PrintPoint(ref Point point) {
    Console.WriteLine($"{point.X}, {point.Y}");
}
```

Функция не копирует `Point` и не может менять его через `point`.

### `refvar`: изменяемая ссылка

```cvolo
void MovePoint(refvar Point point, int dx, int dy) {
    point.X += dx;
    point.Y += dy;
}
```

Вызов требует изменяемого исходного значения:

```cvolo
var Point p = Point { X: 1, Y: 2 };
MovePoint(refvar p, 10, 20);
```

### Правило aliasing XOR mutability

Безопасная модель не должна одновременно давать несколько конфликтующих способов изменять одну и ту же память. Пока существует активный mutable borrow, конкурирующие borrows или операции, нарушающие его гарантии, блокируются компилятором.

Практический смысл: `refvar` следует держать локальным и короткоживущим, а read-only наблюдение выполнять через `ref`.

## 9.2 Copy, move и owning values

### Copy и Move типы

Компилятор разделяет структуры по поведению при передаче/присваивании:

- маленькие trivial-структуры копируются;
- большие простые структуры тоже могут копироваться, но это может быть дорого;
- структуры с ресурсами, деструкторами или reference-полями становятся move-типами.

```cvolo
struct FileStream {
    int handle;
}

extension FileStream {
    ~FileStream() {
        Close(handle);
    }
}
```

Если такое значение перемещено в другое место, старый owner больше не должен использоваться.

### `heap` и owning values

Динамическое размещение выполняется через `heap`. Результат трактуется как владеющее значение на стеке, а не как обычная nullable-ссылка.

Такой handle отвечает за lifetime выделенной памяти и освобождается через RAII-механику его типа.

## 9.3 Происхождение и время жизни ссылок

Компилятор отслеживает происхождение safe-ссылки: откуда взялась память и достаточно ли долго она будет жить.

### Ссылка на параметр

Ссылка, пришедшая в функцию через параметр, принадлежит вызывающему коду и может быть безопасно возвращена при сохранении подходящей mutability:

```cvolo
ref Point Select(ref Point first, ref Point second, bool useFirst) {
    if (useFirst) {
        return ref first;
    }

    return ref second;
}
```

### Ссылка на global

Global storage живёт дольше отдельного вызова функции, поэтому ссылка на такой объект также может выйти из функции.

### Локальная ссылка не может escape

```cvolo
ref Point Broken() {
    Point local = Point { X: 10, Y: 20 };
    return ref local; // ошибка
}
```

После `return` локальный `Point` перестанет существовать, поэтому компилятор блокирует такой escape.

То же правило важно не только для прямого `return ref`, но и для структур и других значений, которые транзитивно содержат borrowed references.

## 9.4 Borrow lock при pattern matching

Когда `Option<ref T>` раскрывается через `switch (ref ...)`, promoted reference внутри `case` блокирует изменение родительского option до конца case.

```cvolo
switch (ref node.next) {
    case Some next:
        Console.WriteLine($"{next.value}");
        // node.next нельзя перезаписать, пока next активен
        break;
    case None:
        break;
}
```

Это предотвращает invalidation ссылки прямо внутри ветки, где она используется.

## 9.5 Ссылки и потоки

Reference values привязаны к стеку создавшего их потока и не предназначены для свободной передачи между потоками. Для разделяемой изменяемой памяти используйте синхронизированные контейнеры и `lock`.

```cvolo
lock (sharedRegistry) {
    sharedRegistry.activePlayers += 1;
}
```
