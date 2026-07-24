# Архитектура — КаниКар

## Общ преглед
Фронтендът (`index.html`, inline CSS/JS) управлява каталога, филтрите,
количката и admin панела client-side. Автентикацията/сесиите/ролята обаче
минават през реален backend (`server/`) — виж [`SECURITY.md`](SECURITY.md)
защо това разделение съществува.

## Backend (`server/`)
| Файл | Отговорност |
|---|---|
| `server.js` | Express приложение, всички `/api/*` endpoint-и (register/login/logout/me/profile/admin), обслужва и статичния `index.html` |
| `db.js` | SQLite схема (`users`, `sessions`) + сийд на admin акаунта при първо стартиране |
| `auth.js` | Сесии (httpOnly cookie), `requireAuth`/`requireAdmin` middleware |
| `tests/auth.test.js` | Backend unit тестове (node:test + supertest) |

## Основни UI компоненти
| Компонент | Отговорност |
|---|---|
| `.filters` (`searchInput`, `typeFilter`, `constructFilter`, `availFilter`, `brandFilterChips`) | Търсене и многокритериално филтриране |
| `btnGrid` / `btnList` | Превключване на изгледа на каталога |
| `catalogToggle` / `partsToggle` / `serviceToggle` | Разгъваеми секции |
| `modalOverlay` (full product card) | Детайли, поръчка, запитване за оферта |
| `cartOverlay` + `btnCheckout` | Количка и checkout flow |
| Auth модал (`authBtn`, `openAuthModal`) | Вход/регистрация — вика `/api/register`, `/api/login` |
| Admin панел (`openAdminPanel`, `adminTab`) | Табло, поръчки, клиенти, цени, монтаж, каталог, фактури — гейтнат от `isAdmin()`, което чете `currentUser.role` от сървъра |

## Роли
- **Гост** — разглежда каталога, филтрира, добавя в количка, може да
  поръча/запита без акаунт.
- **Регистриран потребител** (`role: 'customer'`) — профил, история на
  поръчките.
- **Admin** (`role: 'admin'`) — единствен сийднат акаунт, ролята се
  задава само в `server/db.js`, никога от клиента.

## Клиентски данни (умишлено оставени client-side)
Поръчки (`kk_all_orders_v1`), живи цени, монтажни услуги и редакция на
каталога остават в `localStorage` — Phase 2, не е мигрирано към SQLite,
защото не е security граница (виж SECURITY.md). Ако каталогът порасне
достатъчно, следваща стъпка би била извеждане на продуктовите данни в
отделен JSON/API.
