# Глава 19. System и стандартная библиотека

`System` — стандартная библиотека Cvolo. В отличие от Base, она **не подключается целиком автоматически**: программа запрашивает нужный namespace через `using System...;` либо обращается к API полным именем `System.*`.

Если Base отвечает за минимальные декларации, необходимые языку, то System содержит обычные пользовательские API: консоль, математические функции, библиотечные namespace и hosted API.

## 19.1 Как подключается System

Обычный импорт root namespace:

```cvolo
using System;

int main() {
    Console.WriteLine("Hello, Cvolo!");
    return 0;
}
```

Без `using` можно обратиться к тому же типу полным именем:

```cvolo
int main() {
    System.Console.WriteLine("Hello, Cvolo!");
    return 0;
}
```

### `using System;` не импортирует всё дерево

Root import не означает автоматическое подключение каждого дочернего namespace.

Например математическая библиотека подключается отдельно:

```cvolo
using System.Math;

val distance = Int.Abs(-12);
```

или используется fully-qualified имя:

```cvolo
val distance = System.Math.Int.Abs(-12);
```

Практическое правило:

- `using System;` — root `System` API;
- `using System.Math;` — API математического namespace;
- `System.X.Y` — явное обращение без `using`.

## 19.2 Что находится в `libraries/System`

SDK хранит стандартную библиотеку отдельным деревом:

```text
libraries/System/
├── Console.cvl
├── Environment.cvl
├── IO/
├── Math/
├── Collections/
├── Text/
├── Threading/
└── ...
```

Это **не список автоматически импортированных API**. Наличие директории в SDK означает, что это часть пространства стандартной библиотеки; конкретный namespace выбирается исходным кодом программы.

В текущем учебнике подробно используются следующие части:

| API | Namespace | Для чего |
|---|---|---|
| `Console` | `System` | консольный вывод |
| `Func<T..., R>` | `System` | delegate с результатом |
| Math facade и type groups | `System.Math` | математические операции и константы |

`Environment`, `IO`, `Collections`, `Text` и `Threading` являются отдельными областями System. Их полный пользовательский API должен документироваться по мере стабилизации соответствующих библиотек; эта глава не придумывает методы, которых ещё нет в публичном описании.

## 19.3 `System.Console`

`Console` относится к root namespace `System`, поэтому типичный executable начинается так:

```cvolo
using System;

int main() {
    Console.WriteLine("Cvolo");
    return 0;
}
```

Полная форма эквивалентна по смыслу:

```cvolo
int main() {
    System.Console.WriteLine("Cvolo");
    return 0;
}
```

`Console` не входит в Base. Код, использующий его, зависит от System и не является Base-only/freestanding кодом.

## 19.4 `Func` и другие готовые библиотечные callable types

System может предоставлять готовые generic callable-типы для распространённых сигнатур. В текущем публичном наборе документируется `Func<T..., R>` — вызов с возвращаемым значением `R`.

Они относятся к библиотечному уровню. Само ключевое слово `delegate` и пользовательские delegate-типы являются возможностями языка:

```cvolo
delegate int MathOp(int a, int b);
```

А `Action`/`Func` — готовые типы System для случаев, когда отдельное имя delegate не требуется.

Если API должен выражать отдельный доменный контракт, именованный delegate часто читается лучше, чем универсальный `Func<...>`.

## 19.5 `System.Math`

Математическая часть System организована по типам:

```text
System.Math
├── Constants
├── Double
├── Float
├── Int
├── UInt
├── Long
├── ULong
├── Short
├── UShort
├── Byte
└── SByte
```

`System.Math` также выступает facade над математическими группами, поэтому можно выбирать между короткой и явной формой API.

### Константы

В `System.Math.Constants` определены double-константы:

| Имя | Значение/назначение |
|---|---|
| `PI` | π |
| `E` | число Эйлера |
| `Tau` | 2π |
| `NaN` | quiet NaN |
| `PositiveInfinity` | +∞ |
| `NegativeInfinity` | -∞ |

У `Float` имеются соответствующие float-значения. Integer groups предоставляют границы своего типа (`MinValue` / `MaxValue` там, где применимо).

### Float и Double

Для `Float` и `Double` предусмотрены типичные числовые операции, включая:

```text
Abs, Sqrt, Cbrt, Pow,
Exp, Exp2, Log, Log2, Log10,
Sin, Cos, Tan,
Floor, Ceil, Trunc, Round,
Min, Max, Clamp,
IsNaN, IsInf, IsFinite,
ToRadians, ToDegrees
```

Пример явного API:

```cvolo
val root = System.Math.Double.Sqrt(81.0);
val angle = System.Math.Double.ToRadians(90.0);
```

Через namespace import:

```cvolo
using System.Math;

val distance = Int.Abs(-12);
```

### Целочисленные группы

Для signed integer groups (`SByte`, `Short`, `Int`, `Long`) базовые операции включают `Abs`, `Min`, `Max` и `Clamp`.

Для unsigned groups (`Byte`, `UShort`, `UInt`, `ULong`) доступны `Min`, `Max` и `Clamp`; `Abs` им не нужен, поскольку значение уже неотрицательное.

Math относится к System, а не к Base, поэтому freestanding-код не должен рассчитывать на `System.Math`.

## 19.6 System и freestanding

Обычная hosted-сборка может выбирать System units по импортам:

```text
project sources
+ Base
+ нужные System namespaces
+ пользовательские packages
```

В режиме `--freestanding` System resolution отключён:

```text
project sources
+ Base
+ freestanding-compatible packages
- System
```

При этом `--freestanding` не отключает Base и не превращает SDK types вроде `Option<T>` в System dependency.

## 19.7 System — не package manager dependency

`System` поставляется вместе с SDK. Его не нужно устанавливать через:

```text
cvolo pkg add ...
```

То же относится к Base. Package manager используется для пользовательских `.cvlib` dependencies и рассматривается в [главе 20](20-packages-and-projects.md).

> [!NOTE]
> Краткий reference по импортам и публичным слоям System находится в [справочнике System](../std/01-system.md). Формальные правила import-driven resolution и freestanding — в [продвинутом разборе Base/System](../advanced/02-base-system-contract.md).
