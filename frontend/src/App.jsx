// frontend/src/App.jsx
import { useEffect, useState } from 'react';
import { buyTicket, fetchMatches } from './services/api';

export default function App() {
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState({ id: 1, name: 'Hincha Demo', role: 'USER', membership: 'SOCIO' });

  useEffect(() => {
    fetchMatches()
      .then((data) => {
        setMatches(data);
        setStatus('ready');
      })
      .catch((err) => {
        setMessage(err.message);
        setStatus('error');
      });
  }, []);

  async function handleBuy(matchId, sectorType) {
    setMessage('');
    try {
      const ticket = await buyTicket({ matchId, sectorType, quantity: 1 }, user);
      setMessage(`Entrada confirmada #${ticket.id} - Total: $${ticket.total_paid}`);
      const updated = await fetchMatches();
      setMatches(updated);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <main style={{ maxWidth: 780, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>CanchaYa</h1>
      <p>
        Perfil activo: <strong>{user.name}</strong> ({user.membership}){' '}
        <button
          onClick={() =>
            setUser((prev) => ({
              ...prev,
              membership: prev.membership === 'SOCIO' ? 'NO_SOCIO' : 'SOCIO',
            }))
          }
        >
          Cambiar a {user.membership === 'SOCIO' ? 'NO_SOCIO' : 'SOCIO'}
        </button>
      </p>

      {message && <p><strong>{message}</strong></p>}
      {status === 'loading' && <p>Cargando partidos...</p>}
      {status === 'error' && <p>Error: {message}</p>}
      {status === 'ready' && matches.length === 0 && <p>No hay partidos cargados.</p>}

      {matches.map((m) => (
        <section key={m.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 12 }}>
          <h3>
            {m.home_team} vs {m.away_team} {m.is_high_demand ? '(Alta Demanda)' : ''}
          </h3>
          <p>Estadio: {m.stadium} — Fecha: {m.starts_at}</p>
          {(m.sectors || []).map((s) => (
            <button
              key={s.sectorType}
              style={{ marginRight: 8 }}
              disabled={s.availableCapacity <= 0}
              onClick={() => handleBuy(m.id, s.sectorType)}
            >
              Comprar {s.sectorType} ({s.availableCapacity}/{s.totalCapacity})
            </button>
          ))}
        </section>
      ))}
    </main>
  );
}