# Base SDK

**Base** is the always-available SDK layer that defines the minimal language-facing library surface. It is not a user package and does not require `using System;`.

Base contains foundational contracts such as `Option<T>`, `Result<T, E>`, `Type`, and compiler-known attributes.

## Why Base exists

The compiler and the source language need a tiny, stable vocabulary even in freestanding builds. Base provides that vocabulary without pulling in hosted operating-system services.
