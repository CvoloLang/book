# `try`, `catch`, `finally` и `defer`

Обработка recoverable errors в Cvolo строится поверх result-shapes, а не runtime exceptions. `catch` обрабатывает `Result<T, E>`, структурный `try` объединяет несколько result-returning операций, а cleanup выражается через lexical `defer` и optional `finally`.

## Expression `catch`

Самая короткая форма задаёт fallback для одного выражения:

```cvolo
int value = Divide(10, 0) catch 0;
```

Для сложной обработки используется arrow-handler:

```cvolo
int fileId = OpenFile() catch (error) => {
    Log(error);
    return GetBackupId();
};
```

Handler должен вернуть значение того типа, которое требуется успешной ветке выражения.

## Структурный `try`

```cvolo
try {
    int fileId = OpenFile();
    Send(fileId);
}
catch (FileError error) {
    Log(error);
}
```

`try` собирает result-producing operations в одном блоке и маршрутизирует их ошибки в `catch` clauses.

## Несколько handlers

```cvolo
try {
    Connect();
    ReadPayload();
}
catch (NetworkError.Timeout) {
    RetryLater();
}
catch (NetworkError error) {
    Log(error);
}
```

Clauses проверяются сверху вниз; первый подходящий handler получает управление.

## `finally`

`finally` — operation-level cleanup после завершения полного `try/catch` composite:

```cvolo
try {
    OpenSession();
}
catch (SessionError error) {
    Log(error);
}
finally {
    CloseSession();
}
```

Он не является вторым механизмом владения ресурсами и не заменяет нормальный lifetime/destructor model.

## `defer`

Для локального cleanup используется lexical `defer`:

```cvolo
File file = OpenFile("data.bin");
defer Close(file);

Process(file);
```

Defers выполняются при выходе из соответствующего scope в LIFO-порядке.

## Как lowering избегает runtime exceptions

Структурный `try` не создаёт exception object и не требует отдельного runtime unwind-механизма для recoverable result errors.

Концептуально compiler lowering использует:

- compiler-generated labeled block для тела `try`;
- state slots для признака ошибки и error payload;
- `break` к synthetic label при `Err`;
- dispatch после выхода из try body;
- `finally` как compiler-generated outer lexical `defer`.

Упрощённая схема:

```cvolo
__try_scope: {
    bool __failed = false;
    Error __error;

    __try_body: {
        var result = Operation();

        if (result is Err error) {
            __failed = true;
            __error = error;
            break __try_body;
        }

        // use result.Ok
    }

    if (__failed) {
        // select matching catch handler
    }
}
```

Реальный lowering дополнительно обязан соблюдать lifetime, `defer`, Resource Move cleanup и порядок `finally`.

> [!NOTE]
> Формальный порядок rewriter passes, dispatch scopes и cleanup boundaries описан в [спецификации lowering `try/catch/finally`](../advanced/06-try-catch-lowering.md).
