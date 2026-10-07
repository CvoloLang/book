# 2.3 Вкладки кода

В некоторых примерах удобнее показывать несколько вариантов кода в одном месте статьи: например, исходную конструкцию и lowering, две версии API или одну идею на разных языках. Cvolo Docs объединяет последовательные fenced-блоки с `tab="..."` в один компонент вкладок.

Исходный Markdown при этом остаётся обычным Markdown, поэтому примеры хорошо читаются на GitHub и в code review даже без веб-интерфейса документации.

## Обычные вкладки

Добавьте `tab="..."` в открывающий fence каждого последовательного блока кода. Значение `tab` станет названием вкладки.

````markdown
```cvolo tab="Source"
int[5] array = { 1, 2, 3, 4, 5 };

foreach (val item in array) 
{
    Console.WriteLine(item);
}
```

```cvolo tab="Source"
int[5] array = { 1, 2, 3, 4, 5 };

foreach (val item in array) 
{
    Console.WriteLine(item);
}
```

```cvolo tab="Lowered form"
val array = [1, 2, 3, 4, 5];

{
    val int __fe_len0 = 5;
    for (var int __fe_i0 = 0; __fe_i0 < __fe_len0; __fe_i0 = __fe_i0 + 1) {
        val i = x[__fe_i0];
        Console.WriteLine(i);
    }
}
```
````

После рендера одновременно показывается только выбранный блок кода, а значения `tab` используются как названия вкладок.

```cvolo tab="Source"
int[5] x = { 1, 2, 3, 4, 5 };

foreach (val i in x) 
{
    Console.WriteLine(i);
}
```

```cvolo tab="Lowered form"
val x = [1, 2, 3, 4, 5];

{
    val int __fe_len0 = 5;
    for (var int __fe_i0 = 0; __fe_i0 < __fe_len0; __fe_i0 = __fe_i0 + 1) {
        val i = x[__fe_i0];
        Console.WriteLine(i);
    }
}
```

Вкладки не привязаны к Cvolo. В каждой можно использовать свой язык и дополнительные атрибуты, например `lines`, `highlight` и `source`, а также правила Go To Definition.

Обычный текст завершает текущую группу вкладок. Если несколько code fence должны образовать один компонент, располагайте их последовательно, без текста между ними.

## Ввод и вывод у каждой вкладки

У каждой вкладки могут быть свои `input` и `output`. Разместите их сразу после code fence этой вкладки, а затем добавляйте следующий code fence с `tab="..."`.

Например, первая вкладка может содержать только вывод, а вторая - ввод и вывод:

````markdown
```cvolo tab="Old"
Console.WriteLine("old");
```

```output
old
```

```cvolo tab="New"
val name = Console.ReadLine();
Console.WriteLine(name);
```

```input
Alice
```

```output
Alice
```
````

`tab="..."` у `input` и `output` указывать не нужно: эти блоки относятся к code fence непосредственно перед ними.

В веб-интерфейсе документации такая последовательность становится одним компонентом вкладок:

```cvolo tab="Old"
Console.WriteLine("old");
```

```output
old
```

```cvolo tab="New"
val name = Console.ReadLine();
Console.WriteLine(name);
```

```input
Alice
```

```output
Alice
```

При переключении вкладки вместе с кодом меняются связанные с ней панели ввода и вывода. Поэтому читатель всегда видит `input` и `output`, относящиеся именно к выбранному примеру.

Атрибуты `input` и `output` необязательны. Вкладка может содержать:

- только код;
- код с `input`;
- код с `output`;
- код с `input` и `output`.

```text
code tab
code tab → input
code tab → output
code tab → input → output
```

Используйте вкладки, когда блоки действительно являются альтернативами. Если читателю нужно видеть несколько фрагментов одновременно или каждый из них требует отдельного объяснения, обычные независимые code blocks будут понятнее.
