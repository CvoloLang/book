# Глава 15. Атрибуты и compile-time операции

Атрибуты добавляют декларациям метаданные, которые компилятор понимает во время анализа и codegen. Compile-time operators позволяют получать имя, тип и layout без runtime reflection.

## 15.1 Атрибуты и управляющие атрибуты

### Атрибуты

Атрибут записывается в квадратных скобках перед декларацией:

```cvolo
[Inline]
int Add(int a, int b) {
    return a + b;
}
```

Атрибуты имеют допустимые targets и compile-time аргументы.

### `[Inline]` и `[NeverInline]`

```cvolo
[Inline]
int FastPath(int x) {
    return x * 2;
}

[NeverInline]
void SlowDiagnosticPath() {
    Console.WriteLine("diagnostic");
}
```

Эти атрибуты управляют политикой inlining, а не меняют семантику результата функции.

### `[UnsafeBody]`

`[UnsafeBody]` позволяет пометить функцию/метод, тело которого работает с unsafe-возможностями по правилам атрибутов языка.

```cvolo
[UnsafeBody]
void NativeOperation() {
    // low-level code
}
```

## 15.2 Имена и типы во время компиляции

### `nameof`

`nameof` возвращает имя символа как compile-time string.

```cvolo
struct Point {
    int x;
    int y;
}

Point p = Point { x: 10, y: 20 };
string a = nameof(p);    // "p"
string b = nameof(p.x);  // "x"
```

### `typeof`

`typeof(Type)` создаёт compile-time type descriptor:

```cvolo
Type pointType = typeof(Point);
```

## 15.3 Размер, выравнивание и layout

### `sizeof<T>()`

```cvolo
nuint bytes = sizeof<Point>();
```

Размер зависит от target layout, поэтому результат связан с платформой компиляции.

### `alignof<T>()`

```cvolo
nuint alignment = alignof<Point>();
```

Оператор полезен для allocators, arena layout и ABI-кода.

### `offsetof<T>(member)`

```cvolo
nuint offset = offsetof<Header>(Payload);
```

Поддерживается и вложенный member path:

```cvolo
nuint offset = offsetof<Packet>(Header.Length);
```
