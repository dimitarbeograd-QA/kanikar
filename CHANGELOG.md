# Changelog

Форматът следва приблизително [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]
### Added
- Пълна QA документация (`qa-docs/TEST_PLAN.md`, `TEST_CASES.md`) и bug report темплейт.
- Технически документи: `README.md`, `ARCHITECTURE.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`.

## 2026-07-24
### Security
- **Оправен критичен bug:** `ownerLogin()` беше видим бутон без парола,
  даващ пълен admin достъп на всеки посетител. Изтрит изцяло; auth/сесии/
  ролята вече минават през реален backend. Виж [`SECURITY.md`](SECURITY.md).
### Added
- `server/` — Express + SQLite + bcrypt backend за регистрация/вход/admin роля.
- `tests/` (Playwright, 15 теста) + `server/tests/` (node:test, 10 теста), вкл.
  регресионен тест за старата admin bypass уязвимост.
- GitHub Actions CI (`.github/workflows/tests.yml`).

## Преди този журнал
По-ранните промени не са документирани тук — виж `git log` за пълна история.
