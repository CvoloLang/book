# Chapter A1. Compilation model

The Advanced book explains the parts of Cvolo that are intentionally hidden from everyday source code: lowering, cleanup ordering, temporary state, and the cost model of higher-level syntax. It is not a second syntax tutorial. It answers a different question: **what contract does the compiler preserve when it turns expressive Cvolo into simpler operations?**

Understanding this model is useful when writing performance-sensitive systems code, reviewing generated IR, or reasoning about whether an abstraction requires allocation, hidden runtime state, or stack unwinding.

## Lowering as a language contract

Lowering maps expressive source syntax to a smaller set of explicit control-flow and data-flow operations. The exact temporary names and internal IR are implementation details; observable ordering, cleanup, ownership, and result propagation are language contracts.

For example, a high-level construct may be represented conceptually as:

```text
source syntax
    ↓
explicit branches + values + lexical cleanup
    ↓
backend IR
    ↓
native code
```

The important distinction is between **observable semantics** and **implementation spelling**. A compiler is free to remove temporaries, merge branches, or optimize checks when it can prove the result is equivalent. It is not free to change which cleanup runs, which value is observed, or which branch is selected.

> [!IMPORTANT]
> Code shown in Advanced lowering chapters is a semantic model. It documents behavior and cost boundaries, not compiler-generated variable names.
