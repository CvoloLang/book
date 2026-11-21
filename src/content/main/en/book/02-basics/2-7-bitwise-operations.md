# 2.7 Bitwise Operations

Integers are stored in binary form - as sequences of zeros and ones. Bitwise operators let you inspect and change individual bits without affecting the others. This is useful when several independent flags or small numeric fields need to be stored in a single integer, such as in device settings or a network message header.

**Bit masks** are used to work with this kind of data. A mask is an integer whose `1` bits indicate the positions we are interested in. For example, the mask `0b0100` selects the third bit from the right (bit positions are numbered starting at zero). We can use it to check that bit, set it to `1`, or clear it to `0`.

## Bitwise Operators

| Operator | Description |
| --- | --- |
| `&` | Bitwise AND: a result bit is `1` if both corresponding bits are `1` |
| `\|` | Bitwise OR: a result bit is `1` if at least one of the corresponding bits is `1` |
| `^` | Bitwise XOR: a result bit is `1` if the corresponding bits differ |
| `~` | Bitwise NOT: changes every `0` to `1` and every `1` to `0` |

Consider the integers `12` (`1100` in binary) and `10` (`1010`):

| Operation | Bit-by-bit calculation | Result |
| --- | --- | --- |
| `12 & 10` | `1100 & 1010 = 1000` | `8` |
| `12 \| 10` | `1100 \| 1010 = 1110` | `14` |
| `12 ^ 10` | `1100 ^ 1010 = 0110` | `6` |
| `~12` | `...00001100` → `...11110011` | `-13` |

The `~` row shows only the eight least significant bits. This operator takes a single integer and inverts **all 32 bits** of an `int` value. That is why `~12` produces `-13`, rather than the result of inverting just the four lowest bits shown in the table.

We also encountered `&` and `|` with `bool` values in section [2.5 "Comparisons and Logical Expressions"](2-5-comparisons-and-logic.md). Here, they operate on integers and process each bit separately.

## Bit Shifts

A shift moves the bits of an integer by a specified number of positions:

| Operator | Description | Example |
| --- | --- | --- |
| `<<` | Shifts left, filling vacated positions with zeros | `3 << 2` produces `12` (`0011` → `1100`) |
| `>>` | Shifts right, preserving the sign for negative numbers | `12 >> 2` produces `3` |
| `>>>` | Shifts right, filling vacated high-order positions with zeros | `12 >>> 2` produces `3` |

For nonnegative integers, `>>` and `>>>` often produce the same result. The difference appears with negative values: `>>` preserves the sign bit, while `>>>` fills the vacated positions with zeros. For example, for a 32-bit `int`, the expressions `-8 >> 1` and `-8 >>> 1` produce `-4` and `2147483644`, respectively.

The expression `1 << n` is especially useful for creating a mask with a single `1` bit at position `n`.

## Example: Storing Device Status

Suppose a device reports its status as a single integer. The three lowest bits indicate whether it is online, whether writing is enabled, and whether an error has occurred. Bits four through seven hold a priority value from `0` to `15`. This lets us store several fields in one value.

```cvolo
using System;

int main()
{
    // Masks for three independent flags.
    val onlineMask = 1 << 0;    // 0000 0001
    val writableMask = 1 << 1;  // 0000 0010
    val errorMask = 1 << 2;     // 0000 0100

    // Priority occupies four bits, starting at position 4.
    val priorityShift = 4;
    val priorityMask = 0b1111;

    // The device is online, writing is enabled, and priority is 5.
    // 5 << 4 = 0101 0000; combine the fields with bitwise OR.
    var status = onlineMask | writableMask | (5 << priorityShift);
    Console.WriteLine(status); // 83

    // Check individual flags using their masks.
    Console.WriteLine((status & onlineMask) != 0); // 1: online
    Console.WriteLine((status & errorMask) != 0);  // 0: no error

    // Shift the priority field right and keep only four bits.
    val priority = (status >> priorityShift) & priorityMask;
    Console.WriteLine(priority); // 5

    // Set the error flag without changing other fields.
    status |= errorMask;
    Console.WriteLine(status); // 87

    // Disable writing while preserving the remaining bits.
    status &= ~writableMask;
    Console.WriteLine(status); // 85

    return 0;
}
```

```output
83
1
0
5
87
85
```

In this example, `|` combines several fields into one value, `&` selects particular bits, and `~` helps clear one flag without affecting the others. The `<<` and `>>` operators let us place a numeric field in the assigned bit positions and extract it again.

We can also use `^` to change individual bits: it toggles each selected bit from `0` to `1` or from `1` to `0`. Unlike setting bits with `|`, applying `^` with the same mask a second time restores the original state.