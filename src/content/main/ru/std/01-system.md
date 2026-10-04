<!-- routes: h2 -->
# S1. System и стандартная библиотека

`System` — hosted-слой стандартной библиотеки Cvolo поверх Base. Он не нужен для фундаментальной семантики языка и подключается по запросу исходного кода.

## S1.1 Подключение System

Root import подключает публичную поверхность `System` к текущему исходному файлу:

```cvolo
using System;

int main() {
    Console.WriteLine("Hello, Cvolo!");
    return 0;
}
```

Без import можно использовать полное имя:

```cvolo
System.Console.WriteLine("Hello");
```

`using System;` не означает автоматический import всего дерева дочерних namespace.

## S1.2 System.Console

`Console` относится к root namespace `System` и используется hosted-программами для консольного ввода/вывода.

```cvolo
using System;

Console.WriteLine("Cvolo");
```

`Console` не входит в Base, поэтому Base-only/freestanding код не должен зависеть от него.

## S1.3 Std и Base

Base всегда доступен как SDK foundation. `System` — отдельный hosted-слой.

| Слой | Подключение | Примеры |
|---|---|---|
| Base | всегда | `Option<T>`, `Result<T,E>`, `Type`, compiler-known attributes |
| Std / System | по import | `System.Console`, `System.Math` и другие library namespaces |

В `--freestanding` сборке System resolution отключён, а Base остаётся доступным.
