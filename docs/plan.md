# Plan Técnico — CanchaYa

## 1. Arquitectura General
* **Backend:** Node.js + Express con estructura en capas (`routes`, `controllers`, `services`, `repositories`, `clock`, `middlewares`, `db`).
* **Base de Datos:** PostgreSQL (local para desarrollo/pruebas y Neon en producción).
* **Frontend:** React + Vite separado en `pages`, `components`, `hooks` y `services`.
* **Pruebas:** Tests automatizados sobre reglas de negocio, ventanas horarias con `Clock`, concurrencia (`409 Conflict`) y permisos (`403 Forbidden`).

## 2. Esquema Inicial de Base de Datos (PostgreSQL)
* `users`: `id`, `name`, `email`, `password_hash`, `role`, `membership`, `created_at`.
* `matches`: `id`, `home_team`, `away_team`, `stadium`, `starts_at`, `is_high_demand`, `created_at`.
* `match_sectors`: `id`, `match_id`, `sector_type`, `total_capacity`, `available_capacity`.
* `tickets`: `id`, `user_id`, `match_id`, `sector_type`, `quantity`, `unit_price`, `total_paid`, `penalty_amount`, `refund_amount`, `status`, `created_at`, `cancelled_at`.

## 3. Contratos Clave de la API
* `POST /api/auth/register` y `POST /api/auth/login`
* `GET /api/matches` y `POST /api/matches` (solo `ADMIN`)
* `POST /api/tickets`, `GET /api/tickets/me` y `POST /api/tickets/:id/cancel`
* `GET /api/admin/summary` (solo `ADMIN`)

## 4. Despliegue
* **Base de datos:** Neon (PostgreSQL).
* **Backend:** Render (con variables de entorno `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, seed/admin inicial).
* **Frontend:** Netlify (con `VITE_API_URL` apuntando al backend en Render).