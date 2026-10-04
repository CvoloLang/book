# Base SDK

`Base` — обязательный минимальный SDK-слой Cvolo. Он существует для деклараций, которые нужны самим языковым конструкциям, доступен **всегда**, не требует `using` и не является обычным package.

Используйте эту страницу, когда нужно понять, почему `Option<T>`, `Result<T, E>` или `Type` доступны без `using System;`.

## Что входит в Base

Публичная модель Base состоит из нескольких базовых деклараций:

| Декларация | Для чего нужна |
|---|---|
| `Option<T>` | безопасное optional-значение и основа `T?` |
| `Result<T, E>` | канонический result-shape для recoverable errors |
| `Type` | значение, возвращаемое `typeof(...)` |
| intrinsic attributes | source-visible markers для compiler-known контрактов |

Физически SDK разделяет Base и System:

```text
libraries/
├── Base/
│   ├── Option.cvl
│   ├── Result.cvl
│   ├── Type.cvl
│   └── Attributes/
└── System/
    └── ...
```

## Base — не namespace

К декларациям Base обращаются напрямую:

```cvolo
Option<int> maybeValue;
Result<int, ParseError> parsed;
Type integerType = typeof(int);
```

Не нужно и не следует писать:

```cvolo
using Base; // неверная модель: Base не namespace
```

`Base` — имя SDK-слоя, а не часть qualified name.

## Base доступен без System

Такой код использует язык и Base, но не System:

```cvolo
int? Choose(bool first) {
    if (first) {
        return 10;
    }

    return Option.None;
}
```

Здесь `int?` опирается на `Option<int>`, но `using System;` не требуется.

> [!TIP]
> Хорошая проверка: если конструкция нужна, чтобы выразить фундаментальную семантику языка, она кандидат на Base. Обычные удобные library API — это System или пользовательские packages.

## Compiler-known attributes

Декларации встроенных атрибутов тоже находятся в Base, чтобы type checker, tooling и исходный код видели обычные именованные сущности:

```cvolo
[Inline]
int Add(int a, int b) {
    return a + b;
}
```

К этой группе относятся, в частности:

```text
ErrorAttribute
ResultAttribute
InlineAttribute
NeverInlineAttribute
MustUseAttribute
NoAliasAttribute
UnsafeBodyAttribute
SuppressWarningAttribute
FlagsAttribute
NonExhaustiveAttribute
StrictMutabilityAttribute
IntrinsicAttribute
LibraryImportAttribute
ImportNameAttribute
ExposeNameAttribute
```

Это source-visible declarations, но их специальное поведение определяется компилятором.

## Base и freestanding

`--freestanding` отключает разрешение System, но **не отключает Base**.

```text
обычная сборка:
  language  ✓
  Base      ✓
  System    ✓ по импортам

--freestanding:
  language  ✓
  Base      ✓
  System    ✗
```

Поэтому `Option<T>`, `Result<T, E>` и `Type` остаются доступны и в freestanding-сборке.

## Что не относится к Base

Base не должен превращаться в convenience library. Консольный I/O, математика, filesystem, collections, text helpers, threading и другие hosted API относятся к [System](../std/01-system.md) или другим библиотекам.

> [!NOTE]
> Формальные правила разрешения Base/System и поведения `--freestanding` собраны в [продвинутом разборе Base/System](../advanced/02-base-system-contract.md).
