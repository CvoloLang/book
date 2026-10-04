# Модель языка и уровни документации

Эта спецификация фиксирует устойчивые семантические контракты Cvolo: модель языка, границы safe/unsafe и требования к lowering там, где он влияет на наблюдаемое поведение.

## Область действия

Cvolo рассматривается как compiled systems language со следующими публично значимыми слоями:

1. source language и его type/control-flow semantics;
2. обязательный Base SDK;
3. import-driven System standard library;
4. optional third-party/user packages;
5. native code generation через LLVM backend.

## Нормативные слова

На страницах спецификации используются формулировки:

- **должен** — требование языка/компилятора;
- **не должен** — запрещённое поведение;
- **может** — допустимая реализация или оптимизация, не меняющая observable semantics.

## Safe и unsafe граница

Safe references (`ref T`, `refvar T`) не используют hardware null как состояние отсутствия. Optional-state выражается через `Option<T>` / `T?`.

Raw pointer `T*` и hardware `null` относятся к `unsafe`/ABI boundary.

## Source semantics и lowering

Lowering является частью спецификации только там, где его форма важна для observable guarantees: отсутствия allocations, lifetime order, reference permissions, ABI/layout или freestanding-поведения.

Конкретные внутренние имена compiler classes и временных symbols не являются source-language API.
