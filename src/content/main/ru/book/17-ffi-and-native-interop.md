# Глава 17. FFI и native interop

FFI связывает Cvolo с C ABI и системными библиотеками. Для импортов используется `extern` block, а библиотека задаётся через `[LibraryImport]`.

## 17.1 Импорт native API

### Импорт native library

```cvolo
[LibraryImport("glfw3")]
extern "C" {
    void glClear(int mask);
    void glClearColor(float r, float g, float b, float a);
}
```

Все функции внутри блока относятся к одной библиотеке.

### Platform-specific paths

При наличии standard library атрибут может хранить пути для разных платформ:

```cvolo
[LibraryImport("glfw3",
    win:   "./dependencies/win/glfw3.dll",
    linux: "./dependencies/linux/libglfw3.so",
    mac:   "./dependencies/mac/libglfw3.dylib")]
extern "C" {
    bool Init();
}
```

### `[ImportName]`

Имя функции в Cvolo может отличаться от native symbol:

```cvolo
[LibraryImport("glfw3")]
extern "C" {
    [ImportName("glfwInit")]
    bool Init();
}
```

Код Cvolo вызывает `Init()`, а linker ищет `glfwInit`.

### Calling convention

После `extern` задаётся ABI:

```cvolo
[LibraryImport("kernel32")]
extern "system" {
    uint GetCurrentProcessId();
}
```

Для обычной C ABI используется `extern "C"`.

## 17.2 Безопасные wrappers над FFI

Хороший wrapper не выпускает low-level детали наружу:

```cvolo
[LibraryImport("native")]
internal extern "C" {
    int native_open(string path);
}

public int Open(string path) {
    return native_open(path);
}
```

Visibility import-side деклараций позволяет сохранить ABI слой внутренней деталью пакета.

## 17.3 Native exports

Cvolo-функцию можно экспортировать в native binary через `expose` и `[ExposeName]`. Здесь особенно важна ABI-стабильность: наружу должны выходить типы с однозначным физическим представлением.
