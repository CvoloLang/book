# Lowering `try` / `catch` / `finally`

## Кодовая модель lowering

Исходный Cvolo-код:

```cvolo
try {
    defer { CloseAttempt(); }

    int value = ReadValue();
    Consume(value);
}
catch (ReadError.NotFound error) {
    HandleNotFound(error);
}
catch (ReadError.Timeout error) {
    HandleTimeout(error);
}
finally {
    CloseTransaction();
}
```

Концептуально компилятор может представить ту же семантику через явные result-проверки, состояние dispatch и lexical cleanup:

```cvolo
__try_finally_scope: {
    defer { CloseTransaction(); }

    bool __failed = false;
    int __tag = 0;
    ReadError.NotFound __notFound;
    ReadError.Timeout __timeout;

    __try_scope: {
        defer { CloseAttempt(); }

        var read = ReadValue();
        if (read is Err error) {
            if (error is ReadError.NotFound e) {
                __notFound = e;
                __tag = 1;
            }
            else if (error is ReadError.Timeout e) {
                __timeout = e;
                __tag = 2;
            }

            __failed = true;
            break __try_scope;
        }

        int value = read.Ok;
        Consume(value);
    }

    if (__failed) {
        if (__tag == 1) HandleNotFound(__notFound);
        else if (__tag == 2) HandleTimeout(__timeout);
    }
}
```

> [!NOTE]
> Это **модель семантики**, а не обещание конкретных имён временных переменных в IR. Важны наблюдаемый порядок cleanup, dispatch по ошибке и отсутствие требования к классическому exception runtime для обычного result-based пути.


Cvolo реализует recoverable error flow как compile-time lowering над result-shapes. Это не модель runtime exceptions.

## Architecture invariant

Structural `try` lowering не должен вводить новый heap/runtime entity только ради маршрутизации `Result<T, E>` errors.

Error exit использует compiler-generated labeled block и compiler-managed state slots.

## `catch` operator

Expression form:

```cvolo
int value = Divide(10, 0) catch 0;
```

или:

```cvolo
int value = Parse(text) catch (error) => {
    Log(error);
    return 0;
};
```

должна project `Ok` payload либо вычислить replacement value на `Err` path.

## Structural `try`

Для тела:

```cvolo
try {
    int x = Frob();
    Blah(x);
}
catch (ErrorA error) {
    HandleA(error);
}
catch (ErrorB error) {
    HandleB(error);
}
```

lowering собирает error types, produced внутри body, и формирует dispatch по соответствующим handlers.

## Упрощённая схема state-flag lowering

Концептуально:

```cvolo
bool __failed = false;
int __tag = 0;
ErrorA __errorA;
ErrorB __errorB;

__try: {
    var r1 = Frob();
    if (r1 is Err error) {
        __failed = true;
        __tag = 1;
        __errorA = error;
        break __try;
    }

    int x = r1.Ok;

    var r2 = Blah(x);
    if (r2 is Err error) {
        __failed = true;
        __tag = 2;
        __errorB = error;
        break __try;
    }
}

if (__failed) {
    // dispatch matching catch by tag/type/value pattern
}
```

Generated names and exact storage representation are implementation details; semantic requirements are non-allocation and correct lifetime/order.

## `finally` lowers through `defer`

`finally` не создаёт отдельный runtime cleanup mechanism. До обычного defer lowering он преобразуется в compiler-generated lexical defer во **внешнем** composite scope.

Это необходимо для порядка:

```text
try-body cleanup
→ selected catch cleanup
→ compiler error-state cleanup
→ finally
→ surrounding outer-scope cleanup
```

Если generated finally-defer поместить внутрь try-body/dispatch scope, он может выполниться слишком рано и нарушить lifetime.

## Rewriter ordering

Try/catch transformation должен предшествовать defer lowering, потому что first pass может синтезировать defer из source `finally`.

После завершения обоих lowering passes source nodes `finally`/`defer`, предназначенные для этих механизмов, не должны требовать отдельной runtime сущности.

## User exits

`return`, `break` и `continue`, которые покидают composite scope, обязаны выполнять cleanup boundary-by-boundary, innermost first.

Return expression должен быть вычислен до cleanup, если language semantics требуют возврата уже вычисленного значения после выполнения deferred actions.

`panic` не является обычным recoverable result path и не обязан запускать `finally`/defer в рамках этого контракта.
