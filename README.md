# КаниКар — Каталог гуми и джанти за мотокари

Онлайн каталог за гуми и джанти за мотокари, електрокари и транспалетни
колички. Уеб приложение (`index.html`) с търсене, филтри, grid/list
изгледи, детайлна карта на продукт, количка с checkout, потребителски
профили и admin панел. Auth/сесии/ролята вече минават през реален backend
(`server/`) — виж [`SECURITY.md`](SECURITY.md) защо.

## Функционалности
- Търсене по размер гума и филтри (тип машина, конструкция, наличност, марка)
- Grid / List изгледи на каталога
- Секции: Каталог, Части, Сервиз (разгъваеми toggle барове)
- Детайлна карта на продукт с поръчка или запитване за оферта
- Пазарска количка с checkout
- Регистрация/вход с истински backend, потребителски профил с история на поръчките
- Admin панел (табло, поръчки, клиенти, цени, монтаж, каталог, фактури)

## Стартиране

**Пълно приложение (регистрация/вход/admin работят):**
```bash
cd server
npm install
npm start
```
Отвори `http://localhost:3000` — сървърът обслужва и `index.html`, и `/api/*`.

При първо стартиране се сийдва admin акаунт: `admin@kanikar.bg` / `admin123`
(сменете с `KANICAR_ADMIN_PASSWORD` env variable преди първото стартиране в
продукция).

**Само статичен preview (без auth/admin):**
```bash
npx serve .
```

## Тестове
```bash
npm install               # root — Playwright
cd server && npm install  # backend deps
cd ..
npm test                  # пълен E2E сюит (стартира сървъра автоматично)
npm run test:server       # само backend unit тестове
```

## Структура
Виж [`ARCHITECTURE.md`](ARCHITECTURE.md).

## QA / Тестване
Виж [`qa-docs/`](qa-docs/) за test plan и тест кейсове (ръчни) и `tests/` /
`server/tests/` за автоматизираните.

## Принос
Виж [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Сигурност
Виж [`SECURITY.md`](SECURITY.md).
