# Глава 20. Проекты и локальные пакеты

В предоставленных материалах package manager описан как local-first workflow: упаковка проекта в `.cvlib`, установка в пользовательский cache и управление зависимостями через project/lock files.

Package manager в текущей версии ориентирован на локальные feeds и cache; публичный online registry не является обязательной частью рабочего процесса.

> **Base и System не являются такими пакетами.** Они поставляются как SDK layers (`libraries/Base` и `libraries/System`). Base подключён неявно, а System выбирается по `using`/`System.*`. Package manager ниже относится к пользовательским `.cvlib` dependencies. См. главы [Base SDK](18-base-sdk.md) и [System](19-system-standard-library.md).

## 20.1 Создание и подключение пакета

### Создание `.cvlib`

Основная команда:

```text
cvolo pack <path>
```

Она собирает package artifact из Cvolo project.

### Установка локального пакета

```text
cvolo pkg install ./Foo.cvlib
```

Установленный package помещается в per-user cache Cvolo.

### Добавление зависимости

```text
cvolo pkg add Foo --version ^1.0.0
```

Удаление и просмотр:

```text
cvolo pkg remove Foo
cvolo pkg list
```

## 20.2 Lock file и воспроизводимые зависимости

Resolver фиксирует выбранные версии в lock file. После этого чистая машина может выполнить:

```text
cvolo pkg install
```

и восстановить зависимости из локального feed/cache, если они доступны.

## 20.3 Обновление и cache

### Обновление

```text
cvolo pkg update
cvolo pkg update Foo
```

Update пересчитывает dependency resolution и переписывает lock file.

### Cache

```text
cvolo pkg cache list
cvolo pkg cache prune --unused
cvolo pkg cache clear
```

Текущий package manager работает локально: HTTP search/publish и публичный registry не входят в описанный пользовательский workflow.
