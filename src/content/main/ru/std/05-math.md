<!-- routes: h2 -->
# S2. `System.Math`

`System.Math` — отдельный namespace стандартной библиотеки для числовых операций и констант. Он не импортируется автоматически вместе с root `System`.

```cvolo
using System.Math;

val distance = Int.Abs(-12);
```

Полная форма без import:

```cvolo
val distance = System.Math.Int.Abs(-12);
```

## S2.1 Константы

`System.Math.Constants` содержит общие математические константы для floating-point вычислений.

| Имя | Назначение |
|---|---|
| `PI` | π |
| `E` | число Эйлера |
| `Tau` | 2π |
| `NaN` | quiet NaN |
| `PositiveInfinity` | +∞ |
| `NegativeInfinity` | -∞ |

Константы относятся к Std, а не к Base.

## S2.2 Float и Double

Floating-point группы собирают операции, специфичные для `float` и `double`.

```cvolo
val root = System.Math.Double.Sqrt(81.0);
val angle = System.Math.Double.ToRadians(90.0);
```

К этой области относятся операции вроде `Abs`, `Sqrt`, `Cbrt`, `Pow`, `Exp`, `Log`, `Sin`, `Cos`, `Tan`, `Floor`, `Ceil`, `Round`, `Min`, `Max`, `Clamp`, а также проверки `IsNaN`, `IsInf`, `IsFinite`.

Разделение по типам позволяет API явно фиксировать точность вычисления и не скрывать преобразования между `float` и `double`.

## S2.3 Целочисленные группы

Integer API также разбит по конкретным представлениям:

```text
Int, UInt, Long, ULong,
Short, UShort, Byte, SByte
```

Для signed-групп доступны операции вроде `Abs`, `Min`, `Max` и `Clamp`:

```cvolo
using System.Math;

int value = Int.Abs(-42);
int bounded = Int.Clamp(value, 0, 100);
```

Unsigned-группам `Abs` не требуется, потому что их значения уже неотрицательны.

## S2.4 Почему Math находится в Std

Math helpers не нужны компилятору для выражения базовой семантики Cvolo. Это обычный библиотечный API, поэтому он живёт в System и отключается вместе с hosted Std в freestanding-режиме.
