# Especificación Funcional y Técnica — CanchaYa

## 1. Propósito
**CanchaYa** es una aplicación web de venta y gestión de entradas para partidos de fútbol. Permite a hinchas (Socios y No Socios) consultar partidos disponibles, comprar entradas respetando reglas de negocio, y cancelar entradas con penalidades según antelación; y a un Administrador crear partidos, configurar cupos por sector y consultar métricas de venta y ocupación.

## 2. Reglas de Negocio

* **RN-01 — Roles y Tipos de Usuario:**
  * Existen dos roles: `USER` (Hincha) y `ADMIN` (Administrador del club).
  * Un usuario con rol `USER` tiene además una condición de membresía: `SOCIO` o `NO_SOCIO`.
  * Solo `ADMIN` puede crear partidos (`POST /api/matches`) y consultar el reporte general de recaudación y ocupación (`GET /api/admin/summary`).
  * Un usuario autenticado con rol `USER` que intente acceder a rutas de `ADMIN` debe recibir `403 Forbidden`.

* **RN-02 — Cálculo de Precios por Sector, Alta Demanda y Membresía:**
  * Precios base por sector:
    * `POPULAR`: `$15000`
    * `PLATEA_ALTA`: `$30000`
    * `PLATEA_BAJA`: `$45000`
  * Si el partido tiene `isHighDemand = true` (clásico / alta demanda), se aplica un recargo del **25%** sobre el precio base: `precioConDemanda = precioBase * 1.25`.
  * Si el comprador es `SOCIO`, se aplica un **30% de descuento** sobre el monto resultante: `precioFinal = round(precioConDemanda * 0.70)`.
  * Si el comprador es `NO_SOCIO`, el precio final es `round(precioConDemanda)`.

* **RN-03 — Ventanas de Venta y Reloj del Sistema (`Clock`):**
  * Toda comparación de fechas y horas debe usar la hora local de Argentina (`America/Argentina/Buenos_Aires`, UTC-3) obtenida a través de una abstracción inyectable `Clock` (nunca `Date.now()` o `new Date()` dispersos sin `Clock` en lógica/tests).
  * Sea `diffHours` la cantidad de horas restantes entre `clock.now()` y `match.startsAt`:
    * Si `diffHours < 2` (incluye partidos ya iniciados o pasados): boletería cerrada. No se permiten compras (`400 Bad Request` o `409 Conflict` según corresponda; usar `400 Bad Request` con mensaje claro).
    * Si `24 <= diffHours <= 72` (entre 72 hs y 24 hs antes): **Preventa exclusiva para `SOCIO`**. Si un `NO_SOCIO` intenta comprar en este rango, responder `403 Forbidden`.
    * Si `2 <= diffHours < 24` (entre 24 hs y 2 hs antes): **Venta general** habilitada para `SOCIO` y `NO_SOCIO`.
    * Si `diffHours > 72` (más de 72 hs antes): venta aún no habilitada (`400 Bad Request`).

* **RN-04 — Límite por Usuario, Cupos por Sector y Concurrencia:**
  * Un usuario puede tener como máximo **2 entradas activas/compradas por partido** (sumando compras previas + la compra actual). Si supera ese límite, responder `400 Bad Request`.
  * Cada partido tiene sectores con `totalCapacity` y `availableCapacity`.
  * Al comprar `quantity` entradas (1 o 2) en un sector:
    * La operación debe ejecutarse dentro de una transacción de base de datos con bloqueo/actualización atómica para evitar condiciones de carrera.
    * Si no hay cupo suficiente en el sector, responder `409 Conflict` y no modificar datos.

* **RN-05 — Cancelación de Entradas y Penalidades:**
  * Solo el dueño de la entrada (o un `ADMIN`) puede cancelar una entrada (`POST /api/tickets/:id/cancel`).
  * Si la entrada ya fue cancelada previamente, responder `409 Conflict`.
  * Sea `hoursUntilMatch` las horas restantes desde `clock.now()` hasta `match.startsAt`:
    * Si `hoursUntilMatch < 4`: **no se permite cancelar** (`400 Bad Request`).
    * Si `hoursUntilMatch >= 24`: cancelación **sin penalidad** (`penaltyAmount = 0`, `refundAmount = paidAmount`). Se libera `ticket.quantity` en el sector.
    * Si `4 <= hoursUntilMatch < 24`: cancelación con **50% de penalidad** (`penaltyAmount = round(paidAmount * 0.50)`, `refundAmount = paidAmount - penaltyAmount`). Se libera `ticket.quantity` en el sector y se registra la penalidad en la entrada / historial del usuario.

## 3. Entidades Principales (Modelo Relacional)
* `users`: `id`, `name`, `email`, `password_hash`, `role` (`USER` | `ADMIN`), `membership` (`SOCIO` | `NO_SOCIO`), `created_at`.
* `matches`: `id`, `home_team`, `away_team`, `stadium`, `starts_at`, `is_high_demand`, `created_at`.
* `match_sectors`: `id`, `match_id` (FK), `sector_type` (`POPULAR` | `PLATEA_ALTA` | `PLATEA_BAJA`), `total_capacity`, `available_capacity`.
* `tickets`: `id`, `user_id` (FK), `match_id` (FK), `sector_type`, `quantity`, `unit_price`, `total_paid`, `penalty_amount`, `refund_amount`, `status` (`CONFIRMED` | `CANCELLED`), `created_at`, `cancelled_at`.

## 4. Endpoints Base de la API
* `POST /api/auth/register` — Registro de hincha (`USER`, `SOCIO` o `NO_SOCIO`).
* `POST /api/auth/login` — Inicio de sesión (retorna token/sesión y datos del usuario).
* `GET /api/matches` — Listado de partidos con sus sectores y disponibilidad actual.
* `POST /api/matches` — Creación de partido + sectores (solo `ADMIN`).
* `POST /api/tickets` — Compra de entradas aplicando `RN-02`, `RN-03` y `RN-04`.
* `GET /api/tickets/me` — Entradas del usuario autenticado.
* `POST /api/tickets/:id/cancel` — Cancelación de entrada aplicando `RN-05`.
* `GET /api/admin/summary` — Recaudación total, penalidades cobradas y ocupación por partido/sector (solo `ADMIN`).