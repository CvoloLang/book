<!-- routes: h2 -->
# B6. Built-in attributes

Base exposes compiler-known attributes as ordinary source-visible names. They do not require `using System;` and remain available in freestanding builds.

The reference is grouped by purpose: result/error shapes, optimization, safety, diagnostics, enum/API evolution, and native interop.

## B6.1 Result and Error

`[Result]` and `[Error]` connect user-defined shapes to the language's result-based control flow.

```cvolo
[Result]
union LoadResult<T, E> {
    T Ok;
    E Err;
}
```

`[Result]` does not turn an arbitrary type into an exception. It marks a shape that participates in the canonical success/error model.

## B6.2 Optimization policy

This group contains `[Inline]`, `[NeverInline]`, and `[Intrinsic]`.

```cvolo
[Inline]
int Add(int a, int b) {
    return a + b;
}
```

`[Inline]` and `[NeverInline]` communicate optimization policy without changing the function signature or source semantics. `[Intrinsic]` marks a declaration whose implementation is compiler/backend-known.

## B6.3 Safety and aliasing

This group contains `[NoAlias]`, `[UnsafeBody]`, and `[StrictMutability]`.

- `[NoAlias]` expresses an additional aliasing contract where supported.
- `[UnsafeBody]` makes an unsafe implementation boundary explicit.
- `[StrictMutability]` strengthens mutability rules for the annotated API or type.

These markers refine compiler-visible contracts; they do not disable normal borrow or lifetime rules.

## B6.4 Diagnostics

- `[MustUse]` requests diagnostics when a significant result is ignored.
- `[SuppressWarning]` suppresses a selected warning where the author deliberately accepts the behavior.

## B6.5 Enum and API evolution

- `[Flags]` marks an enum intended for bitwise combination.
- `[NonExhaustive]` indicates that a public set of variants may grow over time.

## B6.6 Native interop

```cvolo
[LibraryImport("native")]
extern int NativeCall();
```

Interop attributes include `[LibraryImport]`, `[ImportName]`, and `[ExposeName]`. They live in Base because FFI contracts must remain source-visible without hosted `System`.
