# Глава 6. Структуры, методы и жизненный цикл

`struct` в Cvolo описывает данные. Исполняемое поведение выносится в `extension`, поэтому физический layout типа отделён от методов.

## 6.1 Структуры и инициализация

### Объявление структуры

```cvolo
struct Point {
    int X;
    int Y;
}
```

Структуры могут содержать другие структуры:

```cvolo
struct Transform {
    Point Position;
    Point Scale;
}
```

### Инициализация структуры

При literal-инициализации все поля должны быть заданы явно.

```cvolo
Point p = Point { X: 10, Y: 20 };
```

Неполная инициализация запрещена:

```cvolo
// Point p = Point { X: 10 }; // отсутствует Y
```

Если экземпляр должен изменяться, объявите его через `var`:

```cvolo
var Point p = Point { X: 10, Y: 20 };
p.X = 25;
```

## 6.2 Методы и receiver `this`

### Методы через `extension`

```cvolo
extension Point {
    void Print(ref this) {
        Console.WriteLine($"({X}, {Y})");
    }
}
```

Вызов остаётся обычным:

```cvolo
Point p = Point { X: 10, Y: 20 };
p.Print();
```

### Мутабельность `this`

Способ передачи `this` задаёт контракт метода:

```cvolo
extension Point {
    int Sum() {
        return X + Y;
    }

    int SumRef(ref this) {
        return X + Y;
    }

    void Move(refvar this, int dx, int dy) {
        X += dx;
        Y += dy;
    }
}
```

- без модификатора метод работает с копией;
- `ref this` — read-only ссылка;
- `refvar this` — изменяемая ссылка.

Метод с `refvar this` нельзя вызвать на неизменяемом экземпляре.

## 6.3 Конструирование, уничтожение и RAII

### Конструкторы

Конструктор называется так же, как структура, и не имеет возвращаемого типа.

```cvolo
extension Point {
    Point(int x, int y) {
        this.X = x;
        this.Y = y;
    }
}

var Point p = Point(10, 20);
```

Все поля `this` должны быть инициализированы до выхода из конструктора.

### Деструкторы и RAII

Деструктор записывается как `~Type()` и вызывается при завершении lifetime владеющего значения.

```cvolo
struct FileHandle {
    int Handle;
}

extension FileHandle {
    ~FileHandle() {
        CloseHandle(Handle);
    }
}
```

Ресурсные структуры относятся к move-типам: владение переносится, а исходное значение после move больше не используется.

## 6.4 Композиция через `embed`

`embed` добавляет структуру в layout и продвигает её поля/методы.

```cvolo
struct BaseEntity {
    int hp;
}

extension BaseEntity {
    void TakeDamage(refvar this, int amount) {
        hp -= amount;
    }
}

struct Warrior embed BaseEntity {
    int swordDamage;
}
```

После этого можно обращаться к продвинутым членам напрямую:

```cvolo
var Warrior w = Warrior { hp: 100, swordDamage: 45 };
w.hp -= 10;
w.TakeDamage(20);
```
