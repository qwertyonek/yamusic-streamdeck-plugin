# Yandex Music (OpenDeck)

Форк плагина для управления **Яндекс Музыкой** с Stream Deck / OpenDeck через Chrome DevTools Protocol.

**Maintainer:** [qwertyonek](https://t.me/qwertyonek)  
**Original author:** Wibecode / [whxtelxs](https://whxtelxs.dev)

## Возможности

- Play / pause, next / previous
- Like / dislike
- Mute
- Обложка текущего трекa
- Бегущая строка «Артист — Название»
- Текущее и общее время трека

## Требования

- [OpenDeck](https://github.com/nekename/OpenDeck) (Linux / Windows / macOS)
- Node.js 20 (как указано в `manifest.json`)
- Яндекс Музыка с remote debugging, например:
  ```bash
  yandex-music --remote-debugging-port=9222
  ```
  или desktop-файл / ярлык с тем же флагом

## Установка (Linux / OpenDeck)

1. Скопируй папку `ru.yandex.music.sdPlugin` в `~/.config/opendeck/plugins/`
2. Установи зависимости:
   ```bash
   cd plugin && npm install
   ```
3. Перезапусти OpenDeck или выполни:
   ```bash
   opendeck --reload-plugin ru.yandex.music.sdPlugin
   ```
4. Запусти Яндекс Музыку с `--remote-debugging-port=9222`
5. Добавь actions на клавиатуру и проверь соединение в Property Inspector

## Иконки (OpenDeck)

В `manifest.json` пути к картинкам **без расширения** (`imgs/ym-play`). OpenDeck сам дописывает `.png`. Файлы лежат в `imgs/*.png`.

## Разработка

```bash
cd plugin
npm install
node test-connection.js   # проверка CDP-соединения
```

## Лицензия

Форк оригинального плагина. См. историю upstream у Wibecode / whxtelxs.
