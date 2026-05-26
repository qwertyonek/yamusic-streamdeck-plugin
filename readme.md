# Yandex Music — Stream Deck / OpenDeck

Форк [Yandex Music Ajazz Plugin](https://github.com/whxtelxs/Yandex-Music-Ajazz-Plugin) (Wibecode / [whxtelxs](https://whxtelxs.dev)) для **OpenDeck** и совместимых хостов.

**Maintainer:** [qwertyonek](https://t.me/qwertyonek)

## Возможности

- Play / pause, next / previous, like / dislike, mute
- Обложка текущего трека (обновляется по CDP)
- **Кнопка «Обложка»** — показывает обложку и **запускает / перезапускает Яндекс Музыку** с нужным портом отладки (Windows и macOS; см. ниже)
- Бегущая строка «Артист — Название»
- Текущее и общее время трека

## Требования

- [OpenDeck](https://github.com/nekename/OpenDeck) или Stream Deck / StreamDock (Ajazz, Mirabox и т.п.)
- Node.js 20 (у OpenDeck обычно уже есть — см. `manifest.json`)
- Десктопное приложение **Яндекс Музыка** с включённым remote debugging на порту **9222** (порт можно сменить в Property Inspector)

## Установка

Скачай **Release** (`ru.yandex.music.sdPlugin.zip`) или клонируй репозиторий.

Папку `ru.yandex.music.sdPlugin` положи в каталог плагинов хоста:

| Хост | Путь |
|------|------|
| **OpenDeck (Linux)** | `~/.config/opendeck/plugins/` |
| **OpenDeck (Windows)** | `%APPDATA%\opendeck\plugins\` (или как в настройках OpenDeck) |
| **StreamDock / Ajazz (Windows)** | `%APPDATA%\HotSpot\StreamDock\plugins\` |

Перезапусти OpenDeck или:

```bash
opendeck --reload-plugin ru.yandex.music.sdPlugin
```

### Нужен ли `npm install`?

- **Release-архив** — зависимости уже внутри (`plugin/node_modules`). Достаточно распаковать и скопировать папку.
- **Клон из git** — один раз:
  ```bash
  cd ru.yandex.music.sdPlugin/plugin && npm install
  ```

Без `node_modules` плагин не стартует: в `plugin/index.js` нужны `ws`, `chrome-remote-interface` и др.

## Яндекс Музыка и порт отладки

Плагин управляет приложением через **Chrome DevTools Protocol**. Нужен процесс Яндекс Музыки с флагом:

```text
--remote-debugging-port=9222
```

(или другой порт — тот же укажи в Property Inspector → «Порт отладки».)

### Вариант 1 — кнопка «Обложка» (Windows / macOS)

Нажми action **«Обложка трека»** на деке:

- если Яндекс Музыка не запущена — плагин **сам запустит** её с `--remote-debugging-port=…`;
- если запущена **без** debug-порта — попытается **перезапустить** с правильными параметрами.

На **Linux** автозапуск через эту кнопку пока **не реализован** — см. вариант 2.

### Вариант 2 — ярлык / команда (любая ОС, в т.ч. Linux)

Запусти приложение вручную с debug-портом, например:

**Linux**

```bash
yandex-music --remote-debugging-port=9222
```

(имя бинарника зависит от способа установки; можно прописать флаг в `.desktop`.)

**Windows**

В свойствах ярлыка Яндекс Музыки в поле «Объект» добавь в конец:

```text
--remote-debugging-port=9222
```

Пример:

```text
"C:\Users\ИМЯ\AppData\Local\Programs\YandexMusic\Яндекс Музыка.exe" --remote-debugging-port=9222
```

Если музыка уже открыта **без** этого флага, CDP не подключится — закрой приложение и запусти снова (или используй кнопку обложки на Win/macOS).

**macOS**

```bash
open -a "Яндекс Музыка" --args --remote-debugging-port=9222
```

### Проверка

Открой Property Inspector любой кнопки → **Проверить соединение**. Статус должен стать «Подключено».

## Иконки (OpenDeck)

В `manifest.json` пути **без расширения** (`imgs/ym-play`). OpenDeck дописывает `.png`. Файлы: `imgs/*.png` (300×300).

На StreamDock/Ajazz пути могут отличаться — этот форк в первую очередь проверен на **OpenDeck + Linux**.

## Отличия от upstream (Ajazz 1.5.0)

| | Upstream | Этот форк |
|---|----------|-----------|
| OpenDeck / Linux | не целился | да |
| UUID | `com.whxtelxs.streamdock…` | `ru.yandex.music.*` |
| Shuffle / repeat / volume / энкодеры | есть | пока нет |
| Запуск YM с кнопки обложки | play/pause | **запуск / перезапуск с debug-портом** (Win/macOS) |

## Разработка

```bash
cd plugin
npm install
node test-connection.js
```

## Лицензия

Форк оригинального плагина. Upstream: [whxtelxs/Yandex-Music-Ajazz-Plugin](https://github.com/whxtelxs/Yandex-Music-Ajazz-Plugin).
