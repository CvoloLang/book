# 1.1 Первая программа

Для консольного вывода hosted-программа подключает стандартную библиотеку `System`:

```cvolo
using System;

int main() {
    Console.WriteLine("Hello, Cvolo!");
    return 0;
}
```

## Что здесь происходит

- `using System;` подключает поверхность стандартной библиотеки `System` к текущему исходному файлу и позволяет использовать `Console` без полного префикса `System.Console`.
- `int main()` — точка входа executable-программы.
- `Console.WriteLine(...)` выводит строку в консоль.
- Именно в `main` выражение `return 0;` возвращает host-среде код завершения процесса `0`. В обычной функции `return` возвращает значение вызывающему коду.

## Вывод программы

```cvolo
using System;

int main() {
    Console.WriteLine("Hello, Cvolo!");
    return 0;
}
```

```output
Hello, Cvolo!
```
