# Глава 10. Делегаты и замыкания

Delegate в Cvolo — типизированное вызываемое значение. Модель ориентирована на стек и отсутствие скрытого GC.

## 10.1 Делегаты и lambda

### Объявление delegate

```cvolo
delegate int MathOp(int a, int b);
```

Теперь переменная типа `MathOp` может хранить совместимую функцию или lambda.

### Lambda

```cvolo
MathOp add = (a, b) => a + b;
int result = add(10, 20);
```

## 10.2 Захват окружения и lifetime

### Захват по значению

По умолчанию локальные значения захватываются через copy или move — в зависимости от типа.

```cvolo
int factor = 10;
MathOp scaled = (a, b) => (a + b) * factor;
```

`factor` становится частью скрытого closure environment.

### Захват по ссылке

Reference-capture требует явного `[ref]` или `[refvar]` и ограничивается unsafe/unbound-контекстом, потому что lifetime delegate начинает зависеть от внешней переменной.

```cvolo
[UnsafeBody]
void Configure(refvar int factor) {
    MathOp op = [refvar] (a, b) => (a + b) * factor;
    Console.WriteLine($"{op(1, 2)}");
}
```

Такой delegate не может безопасно пережить источник захваченной ссылки.

## 10.3 Делегаты в generic-коде

Для статического dispatch callable можно передавать как generic-параметр:

```cvolo
void Process<T>(T op, int a, int b)
    where T : delegate<int, int> {
    int result = op(a, b);
    Console.WriteLine($"{result}");
}
```

## 10.4 Multicast delegates

Fixed-capacity multicast задаётся через атрибут:

```cvolo
[Multicast(Capacity: 8)]
delegate void EventHandler(int code);
```

Ёмкость является частью физического контракта и не растёт скрыто через heap allocation.
