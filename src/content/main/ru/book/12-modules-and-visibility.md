# Глава 12. Модули и области видимости

Модуль группирует исходные файлы и определяет внешнюю границу API. Для маленького модуля всё может находиться в одном файле; большой модуль может состоять из нескольких файлов и `mod.cvl`.

## 12.1 Модули и исходные файлы

### Однофайловый модуль

```cvolo
module Math;

public int Add(int a, int b) {
    return a + b;
}
```

В single-file модуле public item не требует дополнительного `expose` в `mod.cvl`.

### Многофайловый модуль

Файлы подключаются через `include`:

```cvolo
module Graphics {
    include "Renderer.cvl";
    include "Shader.cvl";
    include "Utils.cvl";
}
```

Все включённые файлы становятся частью одного module scope.

## 12.2 Границы API: visibility и `expose`

### `public`, `internal` и `private`

Базовая идея:

- `private` — видимость ограничена файлом;
- `internal` или отсутствие модификатора — доступ внутри пакета;
- `public` — внешний API.

В multi-file module `public` item должен быть перечислен через `expose` на module boundary.

### `expose`

Первый вариант — item уже `public`, а `mod.cvl` подтверждает экспорт:

```cvolo
// Renderer.cvl
public struct Renderer {
    int Id;
}

// mod.cvl
module Graphics;
include "Renderer.cvl";
expose Renderer;
```

Второй вариант — item остаётся внутренним в исходном файле, а boundary поднимает его до public:

```cvolo
// Renderer.cvl
struct Renderer {
    int Id;
}

// mod.cvl
module Graphics;
include "Renderer.cvl";
expose public Renderer;
```

## 12.3 `namespace` и `using`

Namespace применяется для именования API и стандартной библиотеки.

```cvolo
namespace Game.Math;
```

`using` импортирует namespace, чтобы обращаться к его типам и функциям без полного имени:

```cvolo
using System;

int main() {
    Console.WriteLine("hello");
    return 0;
}
```

То же обращение можно записать полностью квалифицированно:

```cvolo
int main() {
    System.Console.WriteLine("hello");
    return 0;
}
```

Для стандартной библиотеки `using` также является корнем зависимости: компилятор выбирает требуемые Std-модули из фактических импортов и ссылок. Это не аналог C/C++ `#include`.

Важно отличать `using` от module `include`:

- `using System;` — импортирует namespace/API;
- `include "Renderer.cvl";` — включает исходный файл в многофайловый module;
- полное имя вроде `System.Console` может использоваться и без `using System;`.

Для aliasing namespace в advanced syntax доступны отдельные правила.

## 12.4 API boundaries и FFI

FFI-import declaration может быть скрыт через `private`/`internal`, а наружу обычно экспортируется безопасная wrapper-функция. Это позволяет не делать raw native API частью публичного Cvolo API.
