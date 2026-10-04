<!-- routes: h2 -->
# S2. `System.Math`

`System.Math` is the standard-library namespace for numeric operations and constants. It is not imported automatically by root `System`.

```cvolo
using System.Math;

val distance = Int.Abs(-12);
```

Without the import:

```cvolo
val distance = System.Math.Int.Abs(-12);
```

## S2.1 Constants

`System.Math.Constants` contains common floating-point constants such as `PI`, `E`, `Tau`, `NaN`, `PositiveInfinity`, and `NegativeInfinity`.

## S2.2 Float and Double

Floating-point groups collect operations specific to `float` and `double`.

```cvolo
val root = System.Math.Double.Sqrt(81.0);
val angle = System.Math.Double.ToRadians(90.0);
```

This area includes operations such as `Abs`, `Sqrt`, `Cbrt`, `Pow`, `Exp`, `Log`, `Sin`, `Cos`, `Tan`, `Floor`, `Ceil`, `Round`, `Min`, `Max`, `Clamp`, and checks such as `IsNaN`, `IsInf`, and `IsFinite`.

## S2.3 Integer groups

Integer APIs are split by concrete representation:

```text
Int, UInt, Long, ULong,
Short, UShort, Byte, SByte
```

```cvolo
using System.Math;

int value = Int.Abs(-42);
int bounded = Int.Clamp(value, 0, 100);
```

Unsigned groups do not need `Abs` because their values are already non-negative.

## S2.4 Why Math belongs to Std

Math helpers are ordinary library APIs rather than compiler-required language primitives. They live in System and are unavailable when hosted Std resolution is disabled.
