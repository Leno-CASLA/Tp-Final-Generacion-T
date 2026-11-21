import test from 'node:test';
import assert from 'node:assert/strict';
import { FakeClock } from '../src/clock/clock.js';
import {
  calculateCancellation,
  calculateTicketPrice,
  validatePurchaseWindow,
} from '../src/services/ticketService.js';

test('RN-02: calcula precio con alta demanda y descuento de socio', () => {
  const price = calculateTicketPrice({
    sectorType: 'PLATEA_ALTA',
    isHighDemand: true,
    membership: 'SOCIO',
  });
  // 30000 * 1.25 = 37500 -> * 0.7 = 26250
  assert.equal(price, 26250);
});

test('RN-03: bloquea no socio en preventa de 48h y habilita en venta general de 12h', () => {
  const clock = new FakeClock('2026-12-10T18:00:00Z');
  const matchStart = '2026-12-12T18:00:00Z'; // 48h antes

  const presaleNoSocio = validatePurchaseWindow({
    nowDate: clock.now(),
    matchStartsAt: matchStart,
    membership: 'NO_SOCIO',
  });
  assert.equal(presaleNoSocio.allowed, false);
  assert.equal(presaleNoSocio.status, 403);

  clock.advanceHours(36); // ahora faltan 12h
  const generalNoSocio = validatePurchaseWindow({
    nowDate: clock.now(),
    matchStartsAt: matchStart,
    membership: 'NO_SOCIO',
  });
  assert.equal(generalNoSocio.allowed, true);
});

test('RN-05: cancelacion con 10h aplica 50% de penalidad', () => {
  const clock = new FakeClock('2026-12-12T08:00:00Z');
  const matchStart = '2026-12-12T18:00:00Z';

  const result = calculateCancellation({
    nowDate: clock.now(),
    matchStartsAt: matchStart,
    totalPaid: 30000,
  });

  assert.equal(result.allowed, true);
  assert.equal(result.penaltyAmount, 15000);
  assert.equal(result.refundAmount, 15000);
});