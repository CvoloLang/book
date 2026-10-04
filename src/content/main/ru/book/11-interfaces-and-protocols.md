# Глава 11. Interfaces и protocols

Cvolo разделяет два вида контрактов: structural `protocol` и nominal `interface`.

## 11.1 Protocol и interface: два вида контракта

### Protocol: структурный контракт

```cvolo
protocol IPrintable {
    void Print();
}
```

Тип соответствует protocol, если реализует требуемые сигнатуры. Отдельное `implements` не требуется.

```cvolo
struct Point {
    int X;
    int Y;
}

extension Point {
    void Print() {
        Console.WriteLine($"({X}, {Y})");
    }
}
```

### Interface: номинальный контракт

```cvolo
interface IWidget {
    void Click();
}
```

Conformance объявляется явно через `extension Type : Interface`:

```cvolo
extension Button : IWidget {
    void Click() {
        Console.WriteLine("clicked");
    }
}
```

## 11.2 Conformance и реализации по умолчанию

### Retroactive conformance

Поскольку реализация живёт в `extension`, контракт можно добавить отдельно от layout структуры.

```cvolo
extension Point : IPrintable {
    void Print() {
        Console.WriteLine($"({X}, {Y})");
    }
}
```

### Default implementations

Тело метода не помещается прямо внутрь protocol. Общую реализацию можно дать через extension самого контракта.

```cvolo
protocol IPrintable {
    void Print();
    void Info();
}

extension IPrintable {
    void Info() {
        Console.WriteLine("Printable value");
    }
}
```

## 11.3 Композиция контрактов

Контракты объединяются через `:`:

```cvolo
protocol IReader {
    void Read(refvar byte[] buffer);
}

protocol IWriter {
    void Write(ref byte[] buffer);
}

protocol IStream : IReader, IWriter {
    void Flush();
}
```

## 11.4 Dispatch

Текущая модель использует static monomorphization: для конкретного типа компилятор создаёт специализированный код без boxing и runtime-vtable. Из-за этого экспорт contract-параметров через стабильную бинарную ABI-границу ограничен.
