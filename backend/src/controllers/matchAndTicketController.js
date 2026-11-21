import { pool } from '../db/pool.js';
import {
  calculateCancellation,
  calculateTicketPrice,
  validatePurchaseWindow,
} from '../services/ticketService.js';

export function createMatchAndTicketController(clock) {
  return {
    async health(_req, res) {
      res.status(200).json({ status: 'ok', app: 'CanchaYa' });
    },

    async listMatches(_req, res) {
      const result = await pool.query(`
        SELECT m.*, COALESCE(
          json_agg(
            json_build_object(
              'sectorType', ms.sector_type,
              'totalCapacity', ms.total_capacity,
              'availableCapacity', ms.available_capacity
            )
          ) FILTER (WHERE ms.id IS NOT NULL), '[]'
        ) AS sectors
        FROM matches m
        LEFT JOIN match_sectors ms ON ms.match_id = m.id
        GROUP BY m.id
        ORDER BY m.starts_at ASC
      `);
      res.status(200).json(result.rows);
    },

    async createMatch(req, res) {
      const { homeTeam, awayTeam, stadium, startsAt, isHighDemand = false, sectors = [] } = req.body;
      if (!homeTeam || !awayTeam || !stadium || !startsAt) {
        return res.status(400).json({ error: 'Datos del partido incompletos' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const matchInsert = await client.query(
          `INSERT INTO matches (home_team, away_team, stadium, starts_at, is_high_demand)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [homeTeam, awayTeam, stadium, startsAt, Boolean(isHighDemand)]
        );
        const match = matchInsert.rows[0];

        for (const s of sectors) {
          await client.query(
            `INSERT INTO match_sectors (match_id, sector_type, total_capacity, available_capacity)
             VALUES ($1, $2, $3, $3)`,
            [match.id, s.sectorType, s.capacity]
          );
        }

        await client.query('COMMIT');
        return res.status(201).json(match);
      } catch (err) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: err.message });
      } finally {
        client.release();
      }
    },

    async buyTicket(req, res) {
      const userId = Number(req.headers['x-user-id'] || 1);
      const membership = req.headers['x-user-membership'] || 'NO_SOCIO';
      const { matchId, sectorType, quantity = 1 } = req.body;

      if (!matchId || !sectorType || ![1, 2].includes(Number(quantity))) {
        return res.status(400).json({ error: 'Solicitud de compra invalida' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const matchRes = await client.query('SELECT * FROM matches WHERE id = $1', [matchId]);
        if (matchRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Partido no encontrado' });
        }
        const match = matchRes.rows[0];

        const windowCheck = validatePurchaseWindow({
          nowDate: clock.now(),
          matchStartsAt: match.starts_at,
          membership,
        });
        if (!windowCheck.allowed) {
          await client.query('ROLLBACK');
          return res.status(windowCheck.status).json({ error: windowCheck.error });
        }

        const existingRes = await client.query(
          `SELECT COALESCE(SUM(quantity), 0) AS total
           FROM tickets
           WHERE user_id = $1 AND match_id = $2 AND status = 'CONFIRMED'`,
          [userId, matchId]
        );
        const currentCount = Number(existingRes.rows[0].total);
        if (currentCount + Number(quantity) > 2) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Maximo 2 entradas por partido por usuario' });
        }

        const sectorRes = await client.query(
          `UPDATE match_sectors
           SET available_capacity = available_capacity - $1
           WHERE match_id = $2 AND sector_type = $3 AND available_capacity >= $1
           RETURNING *`,
          [Number(quantity), matchId, sectorType]
        );

        if (sectorRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'Cupo insuficiente o sector agotado' });
        }

        const unitPrice = calculateTicketPrice({
          sectorType,
          isHighDemand: match.is_high_demand,
          membership,
        });
        const totalPaid = unitPrice * Number(quantity);

        const ticketInsert = await client.query(
          `INSERT INTO tickets (user_id, match_id, sector_type, quantity, unit_price, total_paid, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'CONFIRMED') RETURNING *`,
          [userId, matchId, sectorType, Number(quantity), unitPrice, totalPaid]
        );

        await client.query('COMMIT');
        return res.status(201).json(ticketInsert.rows[0]);
      } catch (err) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: err.message });
      } finally {
        client.release();
      }
    },

    async cancelTicket(req, res) {
      const ticketId = Number(req.params.id);
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        const ticketRes = await client.query('SELECT * FROM tickets WHERE id = $1 FOR UPDATE', [ticketId]);
        if (ticketRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Entrada no encontrada' });
        }
        const ticket = ticketRes.rows[0];

        if (ticket.status === 'CANCELLED') {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'La entrada ya fue cancelada' });
        }

        const matchRes = await client.query('SELECT * FROM matches WHERE id = $1', [ticket.match_id]);
        const match = matchRes.rows[0];

        const calc = calculateCancellation({
          nowDate: clock.now(),
          matchStartsAt: match.starts_at,
          totalPaid: ticket.total_paid,
        });

        if (!calc.allowed) {
          await client.query('ROLLBACK');
          return res.status(calc.status).json({ error: calc.error });
        }

        await client.query(
          `UPDATE match_sectors
           SET available_capacity = available_capacity + $1
           WHERE match_id = $2 AND sector_type = $3`,
          [ticket.quantity, ticket.match_id, ticket.sector_type]
        );

        const updatedRes = await client.query(
          `UPDATE tickets
           SET status = 'CANCELLED',
               penalty_amount = $1,
               refund_amount = $2,
               cancelled_at = $3
           WHERE id = $4 RETURNING *`,
          [calc.penaltyAmount, calc.refundAmount, clock.now(), ticketId]
        );

        await client.query('COMMIT');
        return res.status(200).json(updatedRes.rows[0]);
      } catch (err) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: err.message });
      } finally {
        client.release();
      }
    },
  };
}