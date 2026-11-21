# 2.6 Assignment and Updating Values

In the article on variables, we learned how `var` allows a variable's value to change after declaration. Now we'll look at ordinary assignment, its shorthand forms, and operations that increase or decrease numeric values by one.

## Assignment

The `=` operator assigns the value of the expression on the right to a mutable variable on the left:

```cvolo
var points = 2;
points = 3;
```

After the second statement, `points` has the value `3`. The variable's type remains unchanged.

A variable declared with `val` cannot be assigned a new value after initialization:

```cvolo tab="Invalid assignment" lines highlight="2"
val points = 2;
points = 3;
```

The compiler rejects line 2 because `points` is immutable.

## Compound Assignment

Compound assignment operators combine an operation and an assignment into a single statement. Instead of writing `total = total + 5;`, you can write `total += 5;`: the current value of `total` is added to `5`, and the result is stored back in the same variable.

```cvolo
var total = 10;
total += 5; // 15
total *= 2; // 30
total -= 3; // 27
```

### Assignment Operators in Cvolo

The table shows the shorthand operators and their equivalent full expressions for an ordinary variable `x`.

| Operator | Shorthand form | Full form | Operation |
| --- | --- | --- | --- |
| `=` | `x = y;` | `x = y;` | Assignment |
| `+=` | `x += y;` | `x = x + y;` | Addition |
| `-=` | `x -= y;` | `x = x - y;` | Subtraction |
| `*=` | `x *= y;` | `x = x * y;` | Multiplication |
| `/=` | `x /= y;` | `x = x / y;` | Division |
| `%=` | `x %= y;` | `x = x % y;` | Remainder |
| `&=` | `x &= y;` | `x = x & y;` | Bitwise AND |
| `\|=` | `x \|= y;` | `x = x \| y;` | Bitwise OR |
| `^=` | `x ^= y;` | `x = x ^ y;` | Exclusive OR (XOR) |
| `<<=` | `x <<= y;` | `x = x << y;` | Left shift |
| `>>=` | `x >>= y;` | `x = x >> y;` | Arithmetic right shift |
| `>>>=` | `x >>>= y;` | `x = x >>> y;` | Logical right shift |

Whether an operation is available depends on the operand types. Arithmetic operators work with compatible numeric values, while shift operators work with integer types. Compound assignment with `&` and `|` can also be used with Boolean values. Bitwise operations and shifts are covered in detail in section [2.7 "Bitwise Operations"](2-7-bitwise-operations.md).

The full expressions in the table illustrate the effect of each operator on an ordinary variable. When assigning to fields, array elements, or other more complex expressions on the left, the rules for evaluating that expression can also matter.

## Increment (`++`) and Decrement (`--`)

The `++` and `--` operators increase or decrease the value of a mutable numeric variable by one. Either operator can appear **before the variable** (prefix form) or **after it** (postfix form).

The variable's value changes in both cases. The difference matters when **the result of the operation is used in another expression**:

- **Prefix form** (`++i`, `--i`) changes the variable and yields its **new** value.
- **Postfix form** (`i++`, `i--`) also changes the variable but yields the value it held **before the change**.

| Form | Expression value when `i` starts at `10` | Value of `i` afterward |
| --- | --- | --- |
| `++i` | 11 | 11 |
| `i++` | 10 | 11 |
| `--i` | 9 | 9 |
| `i--` | 10 | 9 |

### When the Form Matters

Suppose a program assigns sequential numbers to requests. The variable `nextNumber` holds the number to assign to the next request. Postfix increment lets us use that number and prepare the next one at the same time:

```cvolo
var nextNumber = 100;
val assignedNumber = nextNumber++;
// assignedNumber = 100, nextNumber = 101
```

If the variable instead holds the **last assigned** number, we need to increase it before using the resulting value. Prefix increment is suitable here:

```cvolo
var lastNumber = 99;
val assignedNumber = ++lastNumber;
// assignedNumber = 100, lastNumber = 100
```

The choice depends on which value you need: **the value before the variable changes or the value after it changes**. The same rule applies to `--`.

Let's see the difference in a complete program:

```cvolo
using System;

int main()
{
    var prefixValue = 10;
    val prefixResult = ++prefixValue;

    Console.WriteLine(prefixResult);
    Console.WriteLine(prefixValue);

    var postfixValue = 10;
    val postfixResult = postfixValue++;

    Console.WriteLine(postfixResult);
    Console.WriteLine(postfixValue);
    return 0;
}
```

```output
11
11
10
11
```

When the result of the operation is not used, both forms leave the variable with the same value:

```cvolo
var index = 0;
index++; // 1
++index; // 2
index--; // 1
--index; // 0
```