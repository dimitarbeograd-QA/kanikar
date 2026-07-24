# Contributing

## Как да допринесеш
1. Промени в UI/каталог/количка — в `index.html`. Промени в auth/сесии/
   admin роля — в `server/` (никога не връщай тази логика обратно client-side).
2. Пусни автоматизираните тестове: `npm test` (Playwright, стартира сървъра
   сам) и `npm run test:server` (backend unit тестове) — виж `README.md`.
3. Тествай ръчно по чеклиста в [`qa-docs/TEST_CASES.md`](qa-docs/TEST_CASES.md) — особено филтри, количка и checkout.
4. Провери, че комбинирани филтри (search + type + brand) продължават да работят коректно заедно.
5. Commit съобщенията да описват кратко какво и защо се променя.

## Docs
При добавяне на нова функционалност, обнови съответно:
- [`README.md`](README.md)
- [`qa-docs/TEST_CASES.md`](qa-docs/TEST_CASES.md)
- [`CHANGELOG.md`](CHANGELOG.md)
