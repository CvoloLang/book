# 2.5 Comparisons and logical expressions

Comparison operators let you determine whether two values are equal or whether one value is greater than another. If the condition being checked is satisfied, the expression evaluates to `true`; otherwise, it evaluates to `false`. The resulting Boolean value can be used in other expressions, conditions, and loops.

## Comparison operators

| Operator | Meaning |
| --- | --- |
| `==` | Equal to |
| `!=` | Not equal to |
| `<` | Less than |
| `>` | Greater than |
| `<=` | Less than or equal to |
| `>=` | Greater than or equal to |

```cvolo
val score = 72;
val passed = score >= 60;      // true
val perfect = score == 100;    // false
```

`=` is used to assign a value, while `==` compares two values for equality.

## Logical NOT

The `!` operator reverses a Boolean value:

```cvolo
val blocked = false;
val allowed = !blocked; // true
```

## Logical AND and OR

Logical operators let you combine multiple checks. The `&&` (AND) operator evaluates to `true` only when both operands are `true`. For the `||` (OR) operator, it is enough for at least one operand to be `true`.

The table below shows the results for every combination of two Boolean values. For brevity, `0` represents `false` and `1` represents `true`. In Cvolo code, Boolean values are written as `false` and `true`.

| `value1` | `value2` | `&&` (AND) | `\|\|` (OR) |
| --- | --- | --- | --- |
| 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 1 |
| 1 | 0 | 0 | 1 |
| 1 | 1 | 1 | 1 |

For the `bool` type, the single-character operators `&` (AND) and `|` (OR) are also available. They produce the same Boolean results as `&&` and `||`, respectively, but differ in how the right-hand operand is evaluated.

### Access control example

Suppose a user tries to open the administration area of an application. Access requires the user to be **authenticated** and to **have the necessary permissions**. If either requirement is not met, access must be denied. In this example, the results of these checks are predefined; in a real application, they would be determined when processing the user's request.

```cvolo
using System;

int main()
{
    val isAuthenticated = true;
    val hasPermission = false;

    Console.WriteLine(isAuthenticated && hasPermission);
    Console.WriteLine(!isAuthenticated || !hasPermission);
    Console.WriteLine(isAuthenticated & hasPermission);
    Console.WriteLine(!isAuthenticated | !hasPermission);

    return 0;
}
```
```output
0
1
0
1
```

The user is authenticated but does not have the required permissions. The first check therefore returns `false` (`0`), while the second confirms that access should be denied by returning `true` (`1`). The last two lines perform equivalent checks using the single-character `&` and `|` operators: the results are the same, but the rules for evaluating the right-hand operand differ.

## Right-hand operand evaluation

The single-character and double-character logical operators differ in how they evaluate the right-hand side of an expression:

- `&&` - logical AND with short-circuit evaluation: if the left operand is `false`, the right operand is not evaluated.
- `||` - logical OR with short-circuit evaluation: if the left operand is `true`, the right operand is not evaluated.
- `&` - logical AND without short-circuit evaluation: both operands are evaluated.
- `|` - logical OR without short-circuit evaluation: both operands are evaluated.

The `&` and `|` operators can also be applied to integers for bitwise operations. These are covered separately in article 2.7, "Bitwise operations."