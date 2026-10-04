# Глава 4. Условия и циклы

Управляющие конструкции в Cvolo выглядят привычно, но условия всегда должны иметь тип `bool`.

## 4.1 Условия: `if..else`

```cvolo
int temperature = 24;

if (temperature > 30) {
    Console.WriteLine("hot");
}
else if (temperature >= 20) {
    Console.WriteLine("warm");
}
else {
    Console.WriteLine("cold");
}
```

Запись вроде `if (1)` не допускается: числовое значение не преобразуется в `bool` неявно.

## 4.2 Циклы: `while`, `for` и `foreach`

### Цикл `while`

```cvolo
var int i = 0;

while (i < 5) {
    Console.WriteLine($"i = {i}");
    i++;
}
```

`while` удобен, когда условие важнее счётчика.

### Цикл `for`

```cvolo
for (var int i = 0; i < 10; i++) {
    Console.WriteLine($"item {i}");
}
```

Для массивов и slices это базовая форма индексного обхода.

### `foreach`

`foreach` существует как отдельная высокоуровневая конструкция и поддерживает несколько видов привязки текущего элемента.

```cvolo
var int[4] values = { 10, 20, 30, 40 };

foreach (val item in values) {
    Console.WriteLine($"{item}");
}
```

`var item` создаёт изменяемую локальную копию. Изменение такой переменной не меняет коллекцию:

```cvolo
foreach (var item in values) {
    item += 1; // меняется только локальная копия
}
```

Для прямого изменения элемента нужен `refvar`:

```cvolo
foreach (refvar item in values) {
    item += 1; // меняется сам элемент массива
}
```

> [!NOTE]
> Здесь достаточно понимать поведение `foreach` на уровне source-кода. Формы binding, structural iterator contract и то, во что цикл превращается после binding, разобраны в [расширенном разборе `foreach`](../advanced/07-foreach-reference.md) и [спецификации lowering](../advanced/05-foreach-lowering.md).

## 4.3 Управление выполнением цикла

### `break` и `continue`

Внутри цикла `break` завершает текущий цикл, а `continue` переходит к следующей итерации.

```cvolo
for (var int i = 0; i < 10; i++) {
    if (i == 3) continue;
    if (i == 8) break;
    Console.WriteLine($"{i}");
}
```

### Метки и выход из вложенных циклов

Метка позволяет адресовать конкретный цикл или блок.

```cvolo
outer: for (var int row = 0; row < 10; row++) {
    for (var int column = 0; column < 10; column++) {
        if (row == 4 && column == 4) {
            break outer;
        }
    }
}
```

Это полезнее ручных флагов вроде `done = true`, когда нужно выйти сразу из нескольких уровней.
