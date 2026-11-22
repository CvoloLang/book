# 3.2 `for` and `while` Loops

Sometimes a program needs to execute the same instructions several times. For example, it might print the numbers from `0` to `4`, process a series of values, or repeat a check until it gets the desired result.

This is what **loops** are for. A loop lets you repeat a block of code while a given condition is true. Each execution of the loop body is called an **iteration**.

Cvolo provides the `for` and `while` loops for these tasks. Both check a condition before executing the body, but they differ in how the repetition is controlled.

## The `for` Loop

A `for` loop is useful when you need to repeat an action a certain number of times or change a counter step by step.

Consider a program that prints three numbers:

```cvolo
using System;

int main()
{
    for (var i = 0; i < 3; i++)
    {
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

The parentheses after `for` contain three parts separated by semicolons:

- `var i = 0` - **initialization**. Creates a mutable variable `i` with the value `0`. This part runs once, before the loop begins.
- `i < 3` - **continuation condition**. Before each iteration, the program checks whether `i` is less than `3`. The loop body runs while the condition is `true`.
- `i++` - **counter update**. Increases `i` by one after the loop body executes.

### How a `for` Loop Executes

Let's follow the execution step by step:

1. The variable `i` is created with the value `0`.
2. The program checks `i < 3`. The condition is true, so the program prints `0`.
3. The `i++` operation runs, changing `i` to `1`.
4. The condition is checked again. The program prints `1`, then `2` on subsequent iterations.
5. When `i` reaches `3`, the condition `i < 3` evaluates to `false`, and the loop ends.

The program then executes the instruction after the loop, which prints `Done`.

Notice that the loop prints `0`, `1`, and `2`, **but not `3`**. The `<` operator checks for a strict inequality. If we used `i <= 3`, the number `3` would also be printed.

We use `var` for the counter because its value changes. The expression `i++` increases `i` by one. The `++` and `--` operators are covered in detail in section [2.6 "Assignment and Updating Values"](../02-basics/2-6-assignment.md).

## The `while` Loop

A `while` loop executes a block of code **as long as its condition is true**. Unlike `for`, the parentheses after `while` contain only the condition. If you need a counter, you declare and update it separately.

The same program written with a `while` loop looks like this:

```cvolo
using System;

int main()
{
    var i = 0;

    while (i < 3)
    {
        Console.WriteLine(i);
        i++;
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

First, the variable `i` is created. Before each iteration, the program checks `i < 3`. If the condition is `true`, it prints the current value and increments `i`. Then it returns to checking the condition.

When `i` reaches `3`, the condition becomes false, and execution continues after the loop.

**An important difference:** in a `while` loop, updating the variable is not part of the loop header. The code inside the body must do it. If you forget `i++`, the value of `i` stays at `0`, and the condition `i < 3` never becomes false. The loop will repeat indefinitely unless something else interrupts its execution.

## Checking the Condition Before the First Iteration

Both `for` and `while` check their condition **before the first iteration**. This means the loop body might not run at all.

```cvolo
using System;

int main()
{
    var count = 0;

    while (count > 0)
    {
        Console.WriteLine("Inside loop");
        count--;
    }

    Console.WriteLine("Done");
    return 0;
}
```

```output
Done
```

Because `count` is `0`, the condition `count > 0` is false from the start. The program goes straight to the instruction after the loop. A `for` loop behaves the same way if its condition is false on the first check.

As with `if`, the condition in a loop must evaluate to a `bool` value. For example, `while (count > 0)` is valid, but `while (count)` produces a compilation error when `count` has type `int`.

## Scope of a Loop Counter

A variable declared in a `for` loop's header is available inside that loop, but not outside it:

```cvolo tab="Valid"
for (var i = 0; i < 3; i++)
{
    Console.WriteLine(i);
}
```

```cvolo tab="Invalid" lines highlight="6"
for (var i = 0; i < 3; i++)
{
    Console.WriteLine(i);
}

Console.WriteLine(i); // i is no longer in scope
```

In the `while` example, the variable `i` is declared **before the loop**, so it remains accessible after the loop ends.

Variables declared directly inside the braces of a loop body also belong to that block. For more on variable scope, see section [2.9 "Functions"](../02-basics/2-9-functions.md).

## Example: The Sum of the First Five Numbers

Let's use a `for` loop to calculate the sum of the numbers from `1` to `5`:

```cvolo
using System;

int main()
{
    var total = 0;

    for (var number = 1; number <= 5; number++)
    {
        total = total + number;
    }

    Console.WriteLine(total);
    return 0;
}
```

```output
15
```

Before the loop starts, `total` is `0`. On each iteration, the current value of `number` is added to it. The running totals are `1`, `3`, `6`, `10`, and `15`. After the fifth iteration, `number` becomes `6`, the condition `number <= 5` evaluates to false, and the program prints the result.

In this way, `for` and `while` let us execute the same instructions repeatedly without writing them out again in the source code. In the next section, we'll look at `break` and `continue`, which let us exit a loop early or move to its next iteration.