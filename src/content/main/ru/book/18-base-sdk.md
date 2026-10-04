# Глава 18. Base SDK

`Base` — минимальный SDK-слой Cvolo, который нужен самому языку. Он подключён **всегда**, не требует `using` и не является обычным package.

В учебнике важно запомнить практическое правило: **Base уже есть в программе до любых `using`**. Поэтому `Option<T>`, `Result<T, E>` и `Type` доступны даже там, где System вообще не используется.

В Base находятся не «полезные библиотеки вообще», а только декларации, без которых языковые конструкции не смогли бы иметь обычное типизированное представление: `Option<T>`, `Result<T, E>`, `Type` и compiler-known атрибуты.

## 18.1 Что такое Base

Base лежит в SDK отдельно от стандартной библиотеки:

```text
libraries/
├── Base/
│   ├── Option.cvl
│   ├── Result.cvl
│   ├── Type.cvl
│   └── Attributes/
│       ├── ErrorAttribute.cvl
│       ├── ResultAttribute.cvl
│       ├── InlineAttribute.cvl
│       ├── NeverInlineAttribute.cvl
│       ├── MustUseAttribute.cvl
│       ├── NoAliasAttribute.cvl
│       ├── UnsafeBodyAttribute.cvl
│       ├── SuppressWarningAttribute.cvl
│       ├── FlagsAttribute.cvl
│       ├── NonExhaustiveAttribute.cvl
│       ├── StrictMutabilityAttribute.cvl
│       ├── IntrinsicAttribute.cvl
│       ├── LibraryImportAttribute.cvl
│       ├── ImportNameAttribute.cvl
│       └── ExposeNameAttribute.cvl
└── System/
    └── ...
```

### Base — это не namespace

Декларации Base находятся в глобальной области имён. Поэтому пишется так:

```cvolo
Option<int> value;
Result<int, ParseError> result;
Type info = typeof(int);
```

и **не** так:

```cvolo
// Неверная модель: Base — имя SDK-слоя, а не namespace.
using Base;
```

### Что относится к языку, а что к Base

Полезно разделять сам синтаксис и supporting declarations:

| Уровень | Примеры |
|---|---|
| сам язык | `int`, `if`, `for`, `ref`, `typeof`, `sizeof` |
| Base SDK | `Option<T>`, `Result<T, E>`, `Type`, встроенные attribute markers |
| System | `Console`, `Action`, `Func`, `System.Math.*` |

Например `typeof(...)` — оператор языка, а его результат имеет тип `Type`, объявленный в Base:

```cvolo
Type type = typeof(int);
```

## 18.2 `Option<T>` и `T?`

`Option<T>` нужен языку для безопасного optional-значения. Каноническая форма выглядит так:

```cvolo
public union Option<T> {
    T Some;
    void None;
}
```

Синтаксис `T?` является удобной формой для `Option<T>`:

```cvolo
int? FindPort(bool found) {
    if (found) {
        return 8080;
    }

    return default(int?);
}
```

Для использования `int?` не нужен `using System;`:

```cvolo
int? port = default(int?);
```

То же правило относится к optional reference-синтаксису: optional-состояние является частью языковой модели, а не API `System`.

## 18.3 `Result<T, E>`

Base предоставляет канонический тип результата:

```cvolo
[Result]
public union Result<T, E> {
    T Ok;
    E Err;
}
```

Он используется там, где операция может завершиться либо значением, либо ошибкой:

```cvolo
Result<int, ParseError> ParseNumber(string text) {
    // ...
}
```

`try` / `catch` работает с result-shape, помеченным `[Result]`. Поэтому пользовательский union также может быть result-типом:

```cvolo
[Result]
union LoadResult<T, E> {
    T Ok;
    E Err;
}
```

`Result<T, E>` из Base — готовая стандартная форма, а не единственное допустимое имя result-типа.

## 18.4 `Type` и `typeof`

`Type` — descriptor типа, который возвращает оператор `typeof`:

```cvolo
Type integerType = typeof(int);
Type stringType = typeof(string);
```

Здесь важно различать:

- `typeof(...)` — синтаксис/оператор языка;
- `Type` — декларация из Base.

Поэтому для type metadata базового уровня не требуется `using System;`.

## 18.5 Встроенные атрибуты Base

Compiler-known атрибуты имеют декларации в Base, поэтому IDE и type checker могут видеть их как обычные именованные сущности, хотя их поведение реализуется компилятором.

Основные группы:

| Назначение | Атрибуты |
|---|---|
| result/error shapes | `[Result]`, `[Error]` |
| оптимизация | `[Inline]`, `[NeverInline]`, `[Intrinsic]` |
| безопасность и aliasing | `[NoAlias]`, `[UnsafeBody]`, `[StrictMutability]` |
| диагностика и API contracts | `[MustUse]`, `[SuppressWarning]` |
| enum/API evolution | `[Flags]`, `[NonExhaustive]` |
| native interop/export | `[LibraryImport]`, `[ImportName]`, `[ExposeName]` |

Например:

```cvolo
[Inline]
int Add(int a, int b) {
    return a + b;
}
```

или:

```cvolo
[UnsafeBody]
void NativeWork() {
    // unsafe body
}
```

Для этих атрибутов не нужен `using System;`.

## 18.6 Base в freestanding-сборке

`--freestanding` отключает разрешение стандартной библиотеки `System`, но **Base остаётся**:

```text
обычная сборка:
  язык       ✓
  Base       ✓
  System     ✓ по реальным импортам

--freestanding:
  язык       ✓
  Base       ✓
  System     ✗
```

Поэтому такой код остаётся возможным:

```cvolo
int? MaybeValue(bool ok) {
    if (ok) return 10;
    return default(int?);
}
```

а зависимость от `System` в freestanding-сборке уже недопустима:

```cvolo
using System;

int main() {
    Console.WriteLine("hello");
    return 0;
}
```

## 18.7 Что **не** входит в Base

Base специально остаётся маленьким. В него не относятся обычные library helpers и hosted API:

- `Console`;
- filesystem API;
- математические функции и константы;
- collections;
- text/encoding helpers;
- networking;
- threads и mutexes;
- host environment API;
- allocators.

Такие возможности принадлежат `System` или другим библиотекам. Следующая глава разбирает [System и стандартную библиотеку](19-system-standard-library.md).

> [!NOTE]
> Справочная версия этой темы находится в [справочнике Base](../base/01-base.md). Точный SDK/resolution contract — в [продвинутом разборе Base/System](../advanced/02-base-system-contract.md).
