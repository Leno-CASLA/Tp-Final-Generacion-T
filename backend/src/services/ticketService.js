const SECTOR_PRICES = {
  POPULAR: 15000,
  PLATEA_ALTA: 30000,
  PLATEA_BAJA: 45000,
};

export function calculateTicketPrice({ sectorType, isHighDemand, membership }) {
  const basePrice = SECTOR_PRICES[sectorType];
  if (!basePrice) {
    throw new Error('SECTOR_INVALIDO');
  }

  const withDemand = isHighDemand ? basePrice * 1.25 : basePrice;
  const finalPrice = membership === 'SOCIO' ? withDemand * 0.7 : withDemand;
  return Math.round(finalPrice);
}

export function validatePurchaseWindow({ nowDate, matchStartsAt, membership }) {
  const diffHours = (new Date(matchStartsAt).getTime() - new Date(nowDate).getTime()) / (1000 * 60 * 60);

  if (diffHours < 2) {
    return { allowed: false, status: 400, error: 'Boleteria cerrada para este partido' };
  }

  if (diffHours > 72) {
    return { allowed: false, status: 400, error: 'La venta aun no esta habilitada' };
  }

  if (diffHours >= 24 && diffHours <= 72 && membership !== 'SOCIO') {
    return { allowed: false, status: 403, error: 'Preventa exclusiva para socios' };
  }

  return { allowed: true, status: 200 };
}

export function calculateCancellation({ nowDate, matchStartsAt, totalPaid }) {
  const hoursUntilMatch = (new Date(matchStartsAt).getTime() - new Date(nowDate).getTime()) / (1000 * 60 * 60);

  if (hoursUntilMatch < 4) {
    return { allowed: false, status: 400, error: 'No se permiten cancelaciones con menos de 4 horas' };
  }

  if (hoursUntilMatch >= 24) {
    return {
      allowed: true,
      penaltyAmount: 0,
      refundAmount: totalPaid,
    };
  }

  const penaltyAmount = Math.round(totalPaid * 0.5);
  return {
    allowed: true,
    penaltyAmount,
    refundAmount: totalPaid - penaltyAmount,
  };
}