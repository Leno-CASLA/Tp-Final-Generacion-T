# AGENTS.md — Reglas de Trabajo para Agentes en CanchaYa

## 1. Fuente de Verdad y Flujo
* La fuente de verdad funcional y técnica es `docs/spec.md`.
* Flujo obligatorio: **Spec → Plan (`docs/plan.md`) → Tareas (`docs/tareas.md`) → Test en Rojo → Implementación Mínima (Verde) → Refactor → Commit por tarea**.
* Nunca inventar reglas de negocio ni modificar comportamientos de `docs/spec.md` sin consultar y actualizar primero la spec.

## 2. Arquitectura y Responsabilidades
* **Backend (Node.js + Express + PostgreSQL):** Separado en capas claras (`routes`, `controllers`, `services`, `repositories`, `clock`, `middlewares`).
* **Reloj (`Clock`):** Toda regla horaria o de anticipación debe recibir o usar una abstracción `Clock` (con implementación real en zona horaria `America/Argentina/Buenos_Aires` y implementación controlable en tests).
* **Frontend (React + Vite):** Separado en `components`, `hooks`, `services` (llamadas HTTP) y `pages`. Manejar explícitamente estados `loading`, `error`, `empty` y `success`. Las reglas de negocio viven en el backend, no duplicadas como fuente de verdad final en la UI.

## 3. Reglas de Calidad (KISS, DRY, YAGNI)
* Mantener soluciones simples, directas y acotadas a la tarea actual (evitar sobreingeniería y dependencias innecesarias).
* Validar entradas en el backend y devolver códigos HTTP semánticos (`200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`).

## 4. Prohibiciones Explícitas
* **NO** subir archivos `.env` ni credenciales, tokens o cadenas de conexión reales al repositorio. Usar `.env.example`.
* **NO** borrar archivos existentes ni modificar migraciones ya aplicadas sin indicación explícita.
* **NO** instalar paquetes nuevos sin justificarlo y registrarlo en la tarea correspondiente.
* **NO** marcar una tarea como hecha en `docs/tareas.md` si los tests no pasan.