# 2.9 Functions

In earlier examples, we wrote code inside `main()` and called `Console.WriteLine()`. In Cvolo, you can declare your own **functions** - named blocks of code that perform a defined algorithm. You can call a function from different parts of a program, pass values to it, and receive a result when needed.

Functions help avoid repeating the same instructions and divide a program into smaller, understandable parts.

## Declaring and Calling a Function

In Cvolo, a function declaration can be represented as `ReturnType FunctionName(InputParameterType parameterName, ...)`. The return type comes before the function name, the parameters go inside parentheses, and the function body goes inside braces. Multiple parameters are separated by commas; if there are no parameters, the parentheses are left empty. The ellipsis here is only a placeholder for additional parameters, not a literal part of Cvolo syntax.

Consider a function that accepts two integer values, multiplies them, and returns the result:

```cvolo
using System;

int Multiply(int left, int right)
{
    return left * right;
}

int main()
{
    val first = Multiply(3, 4);
    val second = Multiply(5, 6);

    Console.WriteLine(first);
    Console.WriteLine(second);
    return 0;
}
```

```output
12
30
```

A function declaration consists of a return type, a name, a parameter list, and a **function body**. In `Multiply`, each part has its own purpose:

- `int` before the name - the **return type**. It specifies that the function returns an integer of type `int`;
- `Multiply` - the **function name**, which is used to call it from elsewhere in the program;
- `(int left, int right)` - the **parameter list** in parentheses. The function has two parameters, `left` and `right`. Both have type `int` and receive values when the function is called;
- `{` and `}` - the braces enclosing the **function body**. Its instructions are executed each time the function is called;
- `return left * right;` - the statement that calculates the product of the parameters, ends the function's execution, and returns the result to the caller.

The call `Multiply(3, 4)` passes two numbers to the function. It calculates their product, and the `return` statement sends the result back to the call site. As a result, `first` receives `12`, and `second` receives `30`.

The `main()` function has a special role: program execution begins there. We introduced this entry point in section [1.1 "Hello World"](../01-introduction/1-1-hello-world.md).

## Function Parameters and Call Arguments

**Parameters** are the names declared inside the parentheses after a function's name. They let the function receive values to work with. In an ordinary function declaration, each parameter must have an explicitly specified type.

**Arguments** are values or expressions supplied when the function is called. They are matched to parameters in order. For example, in `Multiply(3, 4)`, the number `3` is passed to `left`, and `4` is passed to `right`.

The order matters especially when parameters serve different purposes:

```cvolo
int Subtract(int left, int right)
{
    return left - right;
}
```

```cvolo
val a = Subtract(10, 3); // 7
val b = Subtract(3, 10); // -7
```

The compiler checks the number of arguments and whether their types are compatible with the function's parameters. For example, `Subtract(10)` does not match a declaration with two parameters, and `Subtract(10, "3")` passes a string instead of an integer.

A function can have no parameters. In that case, both its declaration and its call use empty parentheses: `GetValue()`.

## Return Values and the `return` Keyword

The type before the function name determines what kind of value the function returns. If it is `int`, the result must be compatible with `int`. The `return` statement ends the function's execution and passes a value back to the calling code.

You can use `return` not only at the end of a function, but also to **exit a function early**. As soon as execution reaches `return`, the function ends: any instructions that would otherwise follow along that execution path are skipped. For example, a function may return early when a particular condition is met. We'll learn how to write such conditions in section [3.1 "Conditional Statements with `if` and `else`"](../03-control-flow/3-1-if-and-else.md).

A return value can be stored in a variable or used as part of an expression:

```cvolo
val result = Multiply(4, 5) + 10; // 30
```

An ordinary function that returns a value must include a corresponding `return` statement. In `main`, `return 0;` has an additional meaning: it reports the program's exit code to the host environment, rather than returning a number to another function.

## Functions Without a Return Value

If a function performs an action without returning a result, use `void` instead of a return type:

```cvolo
void PrintMessage(string message)
{
    Console.WriteLine(message);
}
```

Call this function as a separate statement:

```cvolo
PrintMessage("Order saved");
```

Here, the function prints the supplied string but produces no value that could be assigned to a variable. A `void` function can finish after its last statement without `return`. If necessary, you can exit it early by writing `return;` without an expression.

## Local Variables and Parameter Mutability

Parameters and variables declared inside a function belong to its local scope. For example, the `left` and `right` parameters of `Multiply` are not accessible by those names inside `main`. The same rule applies to local variables created in the function body.

Ordinary parameters in Cvolo are **immutable**. If a calculation requires a value to change, you can create a local variable using `var`:

```cvolo
int NextNumber(int current)
{
    var result = current;
    result++;
    return result;
}
```

The call `NextNumber(10)` returns `11`. Only the local variable `result` changes; the `current` parameter remains unchanged.

When ordinary integer values are passed to a function, it receives their values, not permission to modify the caller's variable. We will cover passing by reference and working with other kinds of data separately, after introducing ownership and references.

## Example: Calculating an Order Total

Suppose a program needs to calculate the cost of an order using the price of one item, the quantity, and the delivery fee. We can put the calculation in one function and the output in another:

```cvolo
using System;

int CalculateTotal(int unitPrice, int quantity, int deliveryFee)
{
    val productsCost = unitPrice * quantity;
    return productsCost + deliveryFee;
}

void PrintOrder(int unitPrice, int quantity, int deliveryFee)
{
    val total = CalculateTotal(unitPrice, quantity, deliveryFee);
    Console.WriteLine(total);
}

int main()
{
    PrintOrder(120, 3, 40);
    PrintOrder(80, 2, 0);
    return 0;
}
```

```output
400
160
```

For the first call to `PrintOrder`, `CalculateTotal` computes `120 * 3 + 40`; for the second, it computes `80 * 2 + 0`. One function handles the calculation, and the other handles the output. If the formula changes, we only need to update `CalculateTotal`, without rewriting the code at each call site.