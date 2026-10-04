# Контракт Base и System

Эта страница фиксирует разделение SDK на обязательный Base и import-driven System.

## Base MUST быть доступен всегда

Compilation universe должен включать Base для обычной сборки, проверки, tooling и `--freestanding`.

Base declarations находятся в global namespace. Не существует обязательных публичных имён `Base.Option`, `Base.Result`, `Base.Type` или директивы `using Base;`.

## Base содержит language-required declarations

Минимальный набор включает:

- `Option<T>`;
- canonical `[Result] Result<T, E>`;
- `Type`;
- intrinsic attribute declarations, необходимые compiler-recognized contracts.

Base не должен становиться convenience library для console, filesystem, math, networking и аналогичных hosted API.

## System является namespace tree

`System` — корень стандартной библиотеки:

```cvolo
using System;
using System.Math;
```

System source units должны объявлять `System` или descendant namespace `System.*`.

## System resolution import-driven

System requirement создаётся по source semantics, включая:

1. `using System...;`;
2. fully-qualified name, rooted at `System`.

Комментарии и string literals не должны создавать dependency.

## Root import не рекурсивен

`using System;` выбирает root units `System`. Он не должен автоматически выбирать `System.Math`, `System.IO`, `System.Collections` и остальные descendant namespaces.

Если выбранный System unit сам зависит от другого namespace, closure расширяется через обычный dependency resolution.

## Freestanding

При `--freestanding`:

- Base остаётся включён;
- System resolution отключён;
- `using System...;` и qualified System dependency должны приводить к диагностике.

## Base/System не являются `.cvlib`

Base и System поставляются SDK и не должны упаковываться или разрешаться как обычные third-party package dependencies.

Потребитель использует Base/System своего совместимого SDK.
