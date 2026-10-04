# S1.5 `Func<T..., R>`

`Func<T..., R>` — generic delegate из `System` для callable-значений, которые **возвращают результат**. Последний generic argument — тип результата `R`, предшествующие аргументы описывают параметры.

## Простой пример

```cvolo
using System;

int Square(int value) {
    return value * value;
}

Func<int, int> square = Square;
int result = square(6);
```

Здесь первый `int` — параметр callable, второй `int` — возвращаемый тип.

## Несколько параметров

```cvolo
int Add(int a, int b) {
    return a + b;
}

Func<int, int, int> add = Add;
int value = add(2, 3);
```

Сигнатура читается как `(int, int) -> int`.

## `Func` и собственный delegate

Для внутренних callbacks `Func<...>` уменьшает количество одноразовых имен. Для публичного доменного API именованный delegate может быть понятнее:

```cvolo
delegate int CompareItems(Item left, Item right);
```

## Не путать с generic-функцией

`Func<T..., R>` — generic **тип delegate** из System. Он не превращает обычную функцию в generic-функцию и не заменяет параметры типа в объявлении функции.
