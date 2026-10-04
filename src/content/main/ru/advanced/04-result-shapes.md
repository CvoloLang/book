# Спецификация result-shapes

`try` / `catch` распознаёт result по semantic metadata, а не по имени типа.

## Canonical Base Result

Base предоставляет готовую форму:

```cvolo
[Result]
public union Result<T, E> {
    T Ok;
    E Err;
}
```

## Пользовательские result-типы

Пользовательский union может участвовать в error flow, если он помечен `[Result]` и удовлетворяет shape contract:

```cvolo
[Result]
union Outcome<T, E> {
    T Ok;
    E Err;
}
```

Тип с именем `Result`, но без `[Result]`, остаётся обычными данными.

## Shape invariants

Валидный `[Result]` union должен:

- быть union declaration;
- содержать variant `Ok`;
- содержать variant `Err`;
- не содержать дополнительных result variants;
- иметь non-void error payload для `Err`;
- позволять однозначно подставить generic arguments в payload-типы.

`[Result]` не является behavioral protocol: `try/catch` не вызывает virtual/structural methods вроде `IsError()` или `TakeValue()`.

## Error payload

Когда instantiated result участвует в `try/catch`, concrete `Err` payload должен удовлетворять error-type rules языка.

## Lowering dependency

Try/catch lowering должен получать `Ok`/`Err` metadata из semantic result shape. Он не должен определять поведение через строковые проверки вида `type.Name == "Result"`.
