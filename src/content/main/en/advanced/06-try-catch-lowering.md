# Chapter A3. How `try/catch/finally` is lowered

The purpose of this chapter is the `try` construct itself: how structured source syntax can become explicit result checks, branch dispatch, and lexical cleanup.

Source:

```cvolo
try {
    defer { CloseAttempt(); }
    int value = ReadValue();
    Consume(value);
}
catch (ReadError.NotFound error) {
    HandleNotFound(error);
}
catch (ReadError.Timeout error) {
    HandleTimeout(error);
}
finally {
    CloseTransaction();
}
```

A conceptual lowering is:

```cvolo
__try_finally_scope: {
    defer { CloseTransaction(); }

    bool __failed = false;
    int __tag = 0;
    ReadError.NotFound __notFound;
    ReadError.Timeout __timeout;

    __try_scope: {
        defer { CloseAttempt(); }

        var read = ReadValue();
        if (read is Err error) {
            if (error is ReadError.NotFound e) {
                __notFound = e;
                __tag = 1;
            }
            else if (error is ReadError.Timeout e) {
                __timeout = e;
                __tag = 2;
            }

            __failed = true;
            break __try_scope;
        }

        int value = read.Ok;
        Consume(value);
    }

    if (__failed) {
        if (__tag == 1) HandleNotFound(__notFound);
        else if (__tag == 2) HandleTimeout(__timeout);
    }
}
```

The stable semantic order is: try body → try-local cleanup → matching catch → catch cleanup → finally. This model does not require heap allocation or classic stack-unwinding machinery for ordinary result-based failure.

> [!NOTE]
> The code above is a semantic model, not a promise about compiler-generated temporary names.
