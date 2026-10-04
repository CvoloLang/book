# Глава 16. Unsafe-код, raw pointers и inline assembly

Safe-код Cvolo использует `ref`, `refvar`, `Option<T>` и bounds-checked collections. Когда требуется прямой доступ к ABI или hardware, используется `unsafe` boundary.

## 16.1 Raw pointers, `null` и переход из safe-кода

### Raw pointer `T*`

Сырой указатель — это низкоуровневый адрес без безопасных reference-гарантий.

```cvolo
unsafe void Clear(int* ptr) {
    *ptr = 0;
}
```

Raw pointers предназначены для interop, allocators, MMIO и аналогичных задач.

### `null`

В safe-коде `null` не используется для обычных ссылок. Он разрешён для raw pointers внутри unsafe context.

```cvolo
unsafe void ReleasePointer(Node* rawPtr) {
    if (rawPtr == null) {
        return;
    }

    free(rawPtr);
}
```

Для safe optional references используйте `Option<ref T>` или `ref T?`.

### Переход от safe reference к pointer

Преобразование должно происходить внутри unsafe boundary, где программист явно принимает ответственность за дальнейшие операции.

Не следует пытаться напрямую превратить `Option<ref T>` в `T*`: сначала option раскрывается и доказывается состояние `Some`.

## 16.2 Inline assembly

### Inline assembly

Базовая форма:

```cvolo
unsafe void DisableInterrupts() {
    asm("cli");
}
```

Assembly expression может возвращать значение:

```cvolo
unsafe int Bswap(int x) {
    return asm<int>("bswap $0", "=r" : x);
}
```

### Operands и clobbers

Расширенная форма позволяет явно описывать registers/constraints и clobbered state.

```cvolo
unsafe void Syscall(ulong number, ulong arg1) {
    asm("syscall",
        [num] "{rdi}" : number,
        [arg1] "{rsi}" : arg1,
        "rcx", "r11"
    );
}
```

Для assembly, который нельзя удалить или свободно перемещать оптимизатором, используйте volatile-вариант inline assembly.

## 16.3 Границы unsafe-кода

Используйте unsafe только в узком слое:

- FFI wrappers;
- allocators;
- drivers и MMIO;
- platform-specific intrinsics;
- inline assembly.

Внешний пользовательский API желательно возвращать обратно в `ref`, `Option<T>`, slices и обычные Cvolo values.
