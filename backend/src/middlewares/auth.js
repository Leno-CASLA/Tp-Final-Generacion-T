export function requireRole(expectedRole) {
  return (req, res, next) => {
    const role = req.headers['x-user-role'] || 'USER';
    if (!req.headers['x-user-id']) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    if (role !== expectedRole) {
      return res.status(403).json({ error: 'Acceso denegado: permisos insuficientes' });
    }
    req.user = {
      id: Number(req.headers['x-user-id']),
      role,
      membership: req.headers['x-user-membership'] || 'NO_SOCIO',
    };
    return next();
  };
}