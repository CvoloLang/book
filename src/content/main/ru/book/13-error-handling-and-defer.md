# Глава 13. Ошибки, `catch` и `defer`

В Cvolo cleanup и обработка ошибок строятся вокруг лексических блоков. `defer` выполняет отложенное действие при выходе из scope, а `catch` умеет работать как часть выражения и как отдельный block handler.

## 13.1 Cleanup через `defer`

### `defer`

Самая простая форма:

```cvolo
void Work() {
    File file = OpenFile("data.bin");
    defer Close(file);

    Process(file);
}
```

`Close(file)` выполняется при выходе из текущего блока.

### Несколько `defer`

Отложенные действия выполняются в LIFO-порядке.

```cvolo
{
    defer Console.WriteLine("third");
    defer Console.WriteLine("second");
    defer Console.WriteLine("first");
}
```

Это удобно для ресурсов, которые открываются последовательно и должны закрываться в обратном порядке.

### Block form

```cvolo
defer {
    Flush();
    Close();
}
```

Block form позволяет объединить несколько cleanup-операций.

### Labeled defer

Отложенный block можно привязать к внешней метке:

```cvolo
session: {
    defer session {
        Console.WriteLine("session finished");
    }

    if (ShouldStop()) {
        break session;
    }
}
```

При `break session` выполняются defers всех покидаемых scopes.

## 13.2 `Result<T, E>` и обработка ошибки выражения

Для result-shaped выражения можно указать fallback:

```cvolo
int value = Divide(10, 0) catch 0;
```

Более сложная обработка использует arrow handler:

```cvolo
int fileId = OpenFile() catch (fileErr) => {
    Console.WriteLine("using backup");
    return GetBackupId();
};
```

Block handler должен явно вернуть значение нужного типа.

## 13.3 `try`, `catch` и `finally`

Для централизованной обработки используется block syntax:

```cvolo
try {
    int fileId = OpenFile();
    TransmitPayload(fileId);
}
catch (ErrorCodes.NotFound) {
    Console.WriteLine("file not found");
}
catch (ErrorCodes.NetworkTimeout) {
    Console.WriteLine("timeout");
}
finally {
    Console.WriteLine("done");
}
```

Внутренний `defer` выполняется при выходе из соответствующего lexical scope и взаимодействует с error path так же, как с обычным `return` или `break`.

> [!NOTE]
> Учебнику достаточно result-based модели и порядка cleanup. Подробные формы `catch`, семантика `finally` и обзор compiler lowering находятся в [расширенном разборе обработки ошибок](../advanced/08-try-catch-reference.md). Формальный labeled-block/state-slot lowering — в [продвинутой главе о `try/catch/finally`](../advanced/06-try-catch-lowering.md). Канонический `Result<T, E>` отдельно описан в [справочнике Result](../base/03-result.md).


> [!NOTE]
> В учебнике достаточно понимать поведение `try`/`catch`/`finally`. Техническая модель того, как конструкция превращается в result-проверки, dispatch и cleanup, разобрана в [продвинутой главе о lowering `try/catch/finally`](../advanced/06-try-catch-lowering.md).
