# 3.1 Conditional Statements with `if` and `else`

An **`if` statement** lets you execute certain code depending on a condition.

You provide a condition and a block of code to execute. If the condition is true (`true`), the program executes that block. If the condition is false (`false`), the block is skipped and execution continues.

When necessary, you can specify an alternative action using `else`.

## The `if` Statement

In Cvolo, an `if` statement is written as `if (Condition)`, followed by a statement or a block of code enclosed in braces.

Consider a program that checks whether a user has access. We've added another output statement after the `if` block to show what happens when execution continues beyond the condition.

```cvolo tab="hasAccess = true"
using System;

int main()
{
    bool hasAccess = true;

    if (hasAccess)
    {
        Console.WriteLine("Access granted");
    }

    Console.WriteLine("Done");
    return 0;
}
```

```output tab="hasAccess = true"
Access granted
Done
```

```cvolo tab="hasAccess = false"
using System;

int main()
{
    bool hasAccess = false;

    if (hasAccess)
    {
        Console.WriteLine("Access granted");
    }

    Console.WriteLine("Done");
    return 0;
}
```

```output tab="hasAccess = false"
Done
```

Here:

- `if` is the keyword that begins a conditional statement;
- `(hasAccess)` is the **condition**, which must evaluate to a value of type `bool`;
- `{` and `}` mark the boundaries of the block that executes only when the condition is `true`.

In the first tab, `hasAccess` is `true`, so the program executes the `if` block and prints `Access granted`. In the second tab, `hasAccess` is `false`, so that block is skipped. In both cases, execution continues after the `if` statement, so `Done` is always printed.

The condition doesn't have to be a `bool` variable. It can also be an expression, such as the comparison `score >= 60`. We covered comparison operators and logical expressions in section [2.5 "Comparisons and Logical Expressions"](../02-basics/2-5-comparisons-and-logic.md).

## Branching with `else`

An `if` statement lets you perform an action when a condition is true. To specify what happens when the condition is false, use `else`:

```cvolo
int temperature = 12;

if (temperature >= 18)
{
    Console.WriteLine("Warm");
}
else
{
    Console.WriteLine("Cool");
}
```

If `temperature >= 18` evaluates to `true`, the first block executes. Otherwise, the block after `else` executes. **Only one of these two branches runs each time the statement is reached.**

The `else` keyword has no condition of its own: it marks the alternative branch of the preceding `if`.

## Checking Multiple Conditions with `else if`

When there are more than two possible outcomes, you can check several conditions in sequence using `else if`:

```cvolo
int score = 75;

if (score >= 90)
{
    Console.WriteLine("Excellent");
}
else if (score >= 60)
{
    Console.WriteLine("Passed");
}
else
{
    Console.WriteLine("Failed");
}
```

The program checks the conditions **from top to bottom**:

1. If `score >= 90`, it prints `Excellent` and skips the remaining branches.
2. Otherwise, it checks `score >= 60`. If that condition is true, it prints `Passed`.
3. If neither condition is met, it prints `Failed`.

Since `score` is `75`, the program prints `Passed`.

The order of conditions matters. If `score >= 60` were checked first, a score of `95` would match that branch, and the program would never check `score >= 90`.

In Cvolo, `else if` is a combination of `else` and another `if`, not a separate keyword.

## Conditions Must Have Type `bool`

Cvolo requires the expression in parentheses after `if` to have type `bool`: either `true` or `false`. A number cannot be used in place of a Boolean value, even if it is nonzero.

```cvolo tab="Valid"
int count = 3;

if (count > 0)
{
    Console.WriteLine("Items found");
}
```

```cvolo tab="Invalid" lines highlight="3"
int count = 3;

if (count)
{
    Console.WriteLine("Items found");
}
```

In the first example, `count > 0` evaluates to a `bool`. In the second, `count` has type `int`, so the compiler reports an error.

Don't confuse `=` with `==`: the first operator assigns a value, while the second compares two values for equality. An `if` condition needs an expression with a Boolean result, not an assignment.

## Nested Conditions and Code Blocks

You can place an `if` statement inside another conditional block. These are called **nested conditions**:

```cvolo
bool isAuthenticated = true;
bool isAdmin = false;

if (isAuthenticated)
{
    if (isAdmin)
    {
        Console.WriteLine("Admin panel");
    }
    else
    {
        Console.WriteLine("User panel");
    }
}
else
{
    Console.WriteLine("Sign in required");
}
```

First, the program checks whether the user is signed in. Only if this first condition is met does it check for administrator privileges. In this example, it prints `User panel`.

Notice that the inner `else` belongs to `if (isAdmin)`, while the outer `else` belongs to `if (isAuthenticated)`.

In Cvolo, a single statement may follow `if` or `else` without braces. However, **using `{` and `}` makes the code easier to read**, especially when conditions are nested.

Variables declared inside a `{ ... }` block belong to that block's scope and cannot be accessed outside it. We discussed local variables in section [2.9 "Functions"](../02-basics/2-9-functions.md).

## The Ternary Operator `?:`

When you need to **choose between two values** rather than execute different blocks of statements, you can use the **ternary operator**:

`Condition ? ValueIfTrue : ValueIfFalse`

```cvolo
int first = 10;
int second = 17;

int maximum = first > second ? first : second; // 17
```

First, `first > second` is evaluated. If the result is `true`, the expression produces `first`; otherwise, it produces `second`. The value `17` is stored in `maximum`.

Unlike `if`, the ternary operator `?:` **is itself an expression**. Its result can be assigned to a variable or used in another expression. The two branches of `?:` must have compatible types; in ordinary Cvolo code, the compiler requires their types to match.

If each alternative needs to execute several statements, using `if` and `else` is usually clearer.

## Example: Checking an Exam Result

Let's combine several conditions in a single function. The program checks whether a score is within the allowed range and prints the appropriate message.

```cvolo
using System;

void PrintResult(int score)
{
    if (score < 0 || score > 100)
    {
        Console.WriteLine("Invalid score");
        return;
    }

    if (score >= 90)
    {
        Console.WriteLine("Excellent");
    }
    else if (score >= 60)
    {
        Console.WriteLine("Passed");
    }
    else
    {
        Console.WriteLine("Failed");
    }
}

int main()
{
    PrintResult(95);
    PrintResult(75);
    PrintResult(40);
    PrintResult(-5);

    return 0;
}
```

```output
Excellent
Passed
Failed
Invalid score
```

First, the function checks whether `score` is valid. If the score is less than `0` or greater than `100`, it prints `Invalid score`, and `return;` **ends the function immediately**. None of the remaining checks are performed.

If the score is valid, the program checks each condition in order and executes the first matching branch. For more on `return` and functions, see section [2.9 "Functions"](../02-basics/2-9-functions.md).