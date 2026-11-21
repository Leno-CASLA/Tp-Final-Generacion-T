# Informe de Pruebas — CanchaYa

## Casos Verificados
1. **RN-02 (Precios):** Verificado cálculo de recargo del 25% por alta demanda y 30% de descuento para socios sobre `PLATEA_ALTA`.
2. **RN-03 (Ventanas y Reloj):** Verificado bloqueo (`403`) a `NO_SOCIO` en preventa (48h antes) y habilitación en venta general (12h antes) usando `FakeClock`.
3. **RN-04 (Cupos y Concurrencia):** Actualización atómica en `match_sectors` con `available_capacity >= quantity` retornando `409 Conflict` cuando no hay cupo.
4. **RN-05 (Cancelaciones y Penalidades):** Verificado cálculo de 50% de penalidad cuando faltan menos de 24h y más de 4h para el partido.