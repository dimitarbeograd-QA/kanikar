# Security Policy

## Докладване на уязвимост
Ако откриеш уязвимост в това приложение, моля не отваряй публичен Issue.
Свържи се директно: **dimitar_beograd@abv.bg**

## Известни съображения
- Owner login (`ownerLogin()`) и auth flow-ът изглеждат implement-нати
  client-side. Ако бъдат свързани с реален backend, ролевата проверка
  **трябва** да се случва server-side — client-only проверка може лесно да
  бъде заобиколена през DevTools.
- Ако в бъдеще checkout flow-ът обработва реални плащания, не съхранявай
  карта/платежни данни в repo-то или client-side кода.
- Не commit-вай API ключове или credentials директно в `index.html`.

## Обхват
Този документ покрива само кода в това repo.
