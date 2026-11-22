# 3.3 Controlling Loops with `break` and `continue`

In the previous section, we learned how to repeat actions using `for` and `while` loops. A loop normally ends when its condition becomes false. But sometimes we need to **stop a loop when an additional condition is met** or **skip the remaining statements in the current iteration**.

In Cvolo, we can do this with `break` and `continue`.

## Exiting a Loop Early with `break`

The `break;` statement immediately exits the nearest enclosing loop. Execution continues with the first statement after that loop.

Suppose we are going through the numbers from `0` to `5`, but want to stop when we reach `3`:

```cvolo
using System;

int main()
{
    for (var i = 0; i < 6; i++)
    {
        if (i == 3)
        {
            break;
        }

        Console.WriteLine(i);
    }

    Console.WriteLine("Done");
    return 0;
}
```

```output
0
1
2
Done
```

When `i == 3`, the condition inside `if` becomes true, and `break;` runs. The program does not reach `Console.WriteLine(i)`. Instead, it exits the loop and prints `Done` from the statement that follows.

You can also use `break` in a `while` loop. The value of the loop's own condition does not matter: once `break;` runs, the loop stops immediately.

## Moving to the Next Iteration with `continue`

The `continue;` statement does not exit the loop. Instead, it **skips the remaining statements in the current iteration** and moves on to the next one.

For example, let's print only odd numbers:

```cvolo
using System;

int main()
{
    for (var i = 0; i < 6; i++)
    {
        if (i % 2 == 0)
        {
            continue;
        }

        Console.WriteLine(i);
    }

    return 0;
}
```

```output
1
3
5
```

The expression `i % 2` gives the remainder after division by `2`. If the remainder is `0`, the number is even. In that case, `continue;` skips the output statement and moves to the next iteration.

**Important:** in a `for` loop, `continue;` still executes the increment expression (`i++`) before the condition is checked again. That is why this loop does not get stuck on an even number.

### `continue` in a `while` Loop

Unlike `for`, a `while` loop has no separate increment expression in its header. Therefore, the position of `continue;` matters.

```cvolo
using System;

int main()
{
    var i = 0;

    while (i < 5)
    {
        i++;

        if (i == 3)
        {
            continue;
        }

        Console.WriteLine(i);
    }

    return 0;
}
```

```output
1
2
4
5
```

Here, `i` increases **before** the `i == 3` check. When `continue;` runs, execution returns to `while (i < 5)` with the updated counter.

If `i++` were placed only at the end of the loop body, after `continue;`, the counter could stop changing under certain conditions, causing an infinite loop.

## `break` and `continue` in Nested Loops

A loop can contain another loop. By default, `break;` and `continue;` affect **the nearest enclosing loop**.

```cvolo
using System;

int main()
{
    for (var row = 0; row < 3; row++)
    {
        for (var column = 0; column < 3; column++)
        {
            if (column == 1)
            {
                break;
            }

            Console.WriteLine(row * 10 + column);
        }
    }

    return 0;
}
```

```output
0
10
20
```

When `column` reaches `1`, `break;` exits the **inner** loop. The outer loop keeps running and advances to the next value of `row`.

If we used `continue;` instead, only the remaining statements of the inner loop's current iteration would be skipped.

## Loop Labels

Sometimes we need to exit an outer loop from within an inner one, or jump directly to the outer loop's next iteration. In Cvolo, we can place a **label** before a loop: a name followed by a colon.

```cvolo
outer: for (var row = 0; row < 3; row++)
{
    // Loop body
}
```

We can then use the label with `break` or `continue`.

### `break` with a Loop Label

```cvolo
using System;

int main()
{
    outer: for (var row = 0; row < 3; row++)
    {
        for (var column = 0; column < 3; column++)
        {
            if (row == 1 && column == 1)
            {
                break outer;
            }

            Console.WriteLine(row * 10 + column);
        }
    }

    Console.WriteLine("Done");
    return 0;
}
```

```output
0
1
2
10
Done
```

`break outer;` exits **the entire outer loop** named `outer`, even though the statement is inside another loop.

### `continue` with a Loop Label

```cvolo
using System;

int main()
{
    outer: for (var row = 0; row < 3; row++)
    {
        for (var column = 0; column < 3; column++)
        {
            if (column == 1)
            {
                continue outer;
            }

            Console.WriteLine(row * 10 + column);
        }
    }

    return 0;
}
```

```output
0
10
20
```

When `column == 1`, `continue outer;` ends the current iteration of the outer loop. Since `outer` is a `for` loop, its increment expression (`row++`) runs next, followed by the `row < 3` condition check.

Labels are especially useful in nested loops because they let us explicitly choose **which loop** a statement should control.

## How `break` and `continue` Differ from `return`

We used `return` when learning about functions. These statements affect execution in different ways:

| Statement | What happens |
| --- | --- |
| `break;` | Exits the nearest enclosing loop. |
| `continue;` | Skips the remaining statements in the current iteration of the nearest enclosing loop. |
| `return;` | Ends the current function. |
