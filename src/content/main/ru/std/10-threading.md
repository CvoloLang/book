# S7. `System.Threading`

`System.Threading` — граница hosted standard library для threading и synchronization API.

Этот namespace отделён от memory model языка: ownership, borrowing и reference safety являются правилами Cvolo, а потоки и синхронизация — библиотечным surface.

Конкретные primitives документируются только после включения в стабильный публичный API.
