# `Result<T, E>`

`Result<T, E>` представляет операцию, которая завершилась **либо значением `T`, либо ошибкой `E`**. Канонический тип находится в Base и используется вместе с `catch` и структурным `try`.

## Что такое `Result<T, E>`

Каноническая форма имеет две ветви:

```cvolo
[Result]
public union Result<T, E> {
    T Ok;
    E Err;
}
```

- `Ok` содержит успешное значение;
- `Err` содержит recoverable error;
- `[Result]` сообщает компилятору, что union является result-shape языка.

Имя `Result` само по себе не магическое. Важен semantic shape, помеченный `[Result]`.

## Функция, которая может завершиться ошибкой

```cvolo
Result<int, ParseError> ParsePort(string text) {
    // ...
}
```

Вызывающий код должен обработать `Err` или передать управление механизму `try`/`catch`.

## Expression `catch`

Для локального fallback можно обработать ошибку прямо в выражении:

```cvolo
int port = ParsePort(text) catch 8080;
```

Arrow-handler позволяет выполнить более сложное восстановление и вернуть значение `T`:

```cvolo
int port = ParsePort(text) catch (error) => {
    Console.WriteLine("invalid port; using fallback");
    return 8080;
};
```

## Структурный `try` / `catch`

Когда в одном блоке выполняется несколько result-returning операций, используется структурный `try`:

```cvolo
try {
    int fileId = OpenFile();
    Send(fileId);
}
catch (FileError error) {
    Console.WriteLine("file operation failed");
}
```

Это **не runtime exception-модель**. Cvolo обрабатывает result-shapes через compile-time lowering.

## Пользовательский result-shape

Можно определить собственный union, если он соблюдает result-contract:

```cvolo
[Result]
union LoadResult<T, E> {
    T Ok;
    E Err;
}
```

Такой тип участвует в `try`/`catch` так же, как Base `Result<T, E>`.

> [!IMPORTANT]
> Result-shape определяется атрибутом и структурой union, а не проверкой имени типа на строку `Result`.

## Связь с `Option<T>`

`Option<T>` отвечает на вопрос «значение есть или отсутствует». `Result<T, E>` отвечает на вопрос «операция успешна или завершилась конкретной ошибкой».

Если причина отсутствия не важна, обычно достаточно `Option<T>`. Если вызывающий код должен знать причину неуспеха, используется result-shape.

> [!NOTE]
> Формальные требования к `[Result]`, вариантам `Ok`/`Err` и типу ошибки описаны в [продвинутом разборе result-shapes](../advanced/04-result-shapes.md). Lowering `try/catch` разобран отдельно в [продвинутом разборе обработки ошибок](../advanced/06-try-catch-lowering.md).
