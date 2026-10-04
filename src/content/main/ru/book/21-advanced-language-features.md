# Глава 21. Расширенные возможности языка

Эта глава собирает возможности, которые полезны после знакомства с базовым синтаксисом. Они не обязательны для первых программ, но помогают писать более выразительный системный код.

## 21.1 Labeled control flow

### Labeled blocks

Метка может принадлежать не только циклу, но и обычному блоку:

```cvolo
parse: {
    if (!ReadHeader()) {
        break parse;
    }

    if (!ReadPayload()) {
        break parse;
    }

    Console.WriteLine("packet ready");
}
```

Это даёт локальный early-exit без вынесения блока в отдельную функцию.

### Targeted `defer`

Cleanup можно зарегистрировать на внешнем labeled block:

```cvolo
session: {
    defer session {
        CloseSession();
    }

    worker: {
        if (ShouldAbort()) break session;
    }
}
```

Cross-iteration targeted defer имеет дополнительные ограничения, чтобы cleanup не переживал корректный iteration lifetime.

## 21.2 Расширенные функции и конструкторы

### Associated functions с ведущей точкой

Receiverless API можно объявить рядом с типом:

```cvolo
public extension Layout {
    public nuint .AlignUp(nuint value, nuint alignment) {
        var nuint remainder = value % alignment;
        if (remainder == 0) return value;
        return value + alignment - remainder;
    }
}
```

Вызов:

```cvolo
nuint aligned = Layout.AlignUp(100, 16);
```

Associated function не является instance method и не получает `this`.

### Constructor chaining

Конструкторы могут делегировать инициализацию друг другу через `this(...)` без inheritance/base model.

```cvolo
extension Buffer<T> {
    Buffer(Allocator allocator, int size) {
        // primary initialization
    }

    Buffer(int size) : this(default(Allocator), size) {
    }
}
```

Используйте эту форму только там, где default-состояние делегируемого аргумента допустимо по правилам типа.

## 21.3 Inlining policy

Для hot paths доступны `[Inline]` и `[NeverInline]`. Эти атрибуты лучше использовать после profiling, а не как замену обычной архитектуре функций.

## 21.4 Когда использовать advanced features

Не начинайте архитектуру программы с advanced-конструкций только потому, что они доступны. Сначала используйте обычные функции, структуры, slices и безопасные ссылки; labeled control flow, constructor chaining и policy-атрибуты добавляйте там, где они реально упрощают код или дают нужный низкоуровневый контроль.
