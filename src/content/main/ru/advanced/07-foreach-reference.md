# `foreach`

`foreach` выполняет тело цикла для каждого элемента массива, slice или структурно итерируемого пользовательского типа.

Используйте `foreach`, когда важен сам последовательный обход, а не индекс элемента.

## Базовая форма

```cvolo
var int[4] values = { 10, 20, 30, 40 };

foreach (val item in values) {
    Console.WriteLine($"{item}");
}
```

## Формы binding

| Форма | Семантика |
|---|---|
| `val item` | read-only binding / значение для чтения |
| `var item` | изменяемая локальная копия; коллекция не меняется |
| `refvar item` | изменяемая ссылка непосредственно на элемент |
| `T item` | явно типизированный read-only binding |

`var` не означает изменение элемента коллекции:

```cvolo
foreach (var item in values) {
    item += 1; // меняется только локальная копия
}
```

Для изменения исходного элемента нужен `refvar`:

```cvolo
foreach (refvar item in values) {
    item += 1;
}
```

## Arrays и slices

Для массивов и slices `foreach` имеет прямой index-based lowering. Концептуально:

```cvolo
foreach (val item in values) {
    Consume(item);
}
```

превращается в форму, эквивалентную:

```cvolo
val int __length = values.Length;

for (var int __index = 0; __index < __length; __index++) {
    val item = values[__index];
    Consume(item);
}
```

Для fixed-size static array граница может быть известна как literal; для slices/heap arrays длина кэшируется перед обходом.

> [!IMPORTANT]
> Это описание semantic lowering. Сгенерированные имена вроде `__index` являются условными и не являются частью source syntax.

## Пользовательские iterable-типы

Для пользовательского типа Cvolo использует structural iteration contract. Тип должен предоставить доступный `GetEnumerator()`, а возвращаемый enumerator — `bool MoveNext()` и `Current`.

Концептуальная форма:

```cvolo
var enumerator = collection.GetEnumerator();

while (enumerator.MoveNext()) {
    val item = enumerator.Current;
    Consume(item);
}
```

Это structural matching: специальный nominal interface не обязателен только ради синтаксиса `foreach`.

## `refvar` и `Current`

`refvar item` допустим только если источник действительно может предоставить изменяемую ссылку на текущий элемент. Если iterator возвращает `Current` по значению или как read-only `ref`, запрос `refvar` должен быть отклонён.

## Заимствование коллекции во время обхода

На время активного `foreach` target collection считается заимствованной для iteration. Операции, меняющие её структурную топологию, не должны инвалидировать текущий обход.

## Что происходит в компиляторе

У `foreach` два основных пути:

1. **array/slice path** — post-binding lowering в индексный `for` без enumerator object;
2. **structural enumerator path** — вызовы `GetEnumerator` / `MoveNext` / `Current`, с сохранением reference permissions.

Это позволяет массивам оставаться zero-overhead, а пользовательским типам — участвовать в `foreach` без жёсткой привязки к одному runtime interface.

> [!NOTE]
> Полный контракт binding, escape boundary и порядок lowering приведены в [продвинутой главе о `foreach`](../advanced/05-foreach-lowering.md).
