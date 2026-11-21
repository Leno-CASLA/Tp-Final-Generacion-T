const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function fetchMatches() {
  const res = await fetch(`${API_URL}/matches`);
  if (!res.ok) throw new Error('Error al cargar partidos');
  return res.json();
}

export async function buyTicket(payload, userSession) {
  const res = await fetch(`${API_URL}/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': String(userSession.id),
      'x-user-role': userSession.role,
      'x-user-membership': userSession.membership,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo comprar');
  return data;
}