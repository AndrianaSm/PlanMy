
const express = require("express");
const db = require("../db");

const router = express.Router();

const allowedStatuses = ["PLANNING", "CONFIRMED", "CANCELLED"];

function validateEvent(body, partial = false) {
  const fields = [
    "name", "eventType", "date", "time",
    "location", "guests", "budget"
  ];

  if (!partial && fields.some((f) => body[f] === undefined)) {
    return "Tutti i campi dell'evento sono obbligatori";
  }

  if (body.name !== undefined &&
      (typeof body.name !== "string" || !body.name.trim())) {
    return "Nome evento non valido";
  }

  if (body.guests !== undefined &&
      (!Number.isInteger(Number(body.guests)) ||
       Number(body.guests) < 1)) {
    return "Il numero di invitati deve essere maggiore di zero";
  }

  if (body.budget !== undefined &&
      (!Number.isFinite(Number(body.budget)) ||
       Number(body.budget) < 0)) {
    return "Budget non valido";
  }

  if (body.status !== undefined &&
      !allowedStatuses.includes(body.status)) {
    return "Stato evento non valido";
  }

  return null;
}

// POST /events — crea un evento
router.post("/", async (req, res, next) => {
  try {
    const error = validateEvent(req.body);
    if (error) return res.status(400).json({ error });

    const {
      name, eventType, date, time,
      location, guests, budget
    } = req.body;

    const result = await db.query(
      `INSERT INTO events
       (user_id, name, event_type, date, time,
        location, guests, budget)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id AS "userId", name,
         event_type AS "eventType", date, time,
         location, guests, budget, status,
         created_at AS "createdAt"`,
      [
        req.user.id, name.trim(), eventType, date, time,
        location, Number(guests), Number(budget)
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "22007" || err.code === "22008") {
      return res.status(400).json({ error: "Data o ora non valida" });
    }
    next(err);
  }
});

// GET /events — lista eventi dell'utente
router.get("/", async (req, res, next) => {
  try {
    const params = [req.user.id];
    let statusFilter = "";

    if (req.query.status) {
      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({ error: "Stato non valido" });
      }

      params.push(req.query.status);
      statusFilter = `AND e.status = $${params.length}`;
    }

    const result = await db.query(
      `SELECT e.id, e.name,
         e.event_type AS "eventType",
         e.date, e.time, e.location, e.guests,
         e.budget, e.status,
         COUNT(b.id)::INTEGER AS "bookedServicesCount"
       FROM events e
       LEFT JOIN bookings b
         ON b.event_id = e.id AND b.status = 'CONFIRMED'
       WHERE e.user_id = $1 ${statusFilter}
       GROUP BY e.id
       ORDER BY e.date ASC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /events/:id — dettaglio evento e servizi prenotati
router.get("/:id", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, event_type AS "eventType",
         date, time, location, guests, budget, status,
         created_at AS "createdAt"
       FROM events
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Evento non trovato" });
    }

    const bookings = await db.query(
      `SELECT b.id, b.provider_id AS "providerId",
         p.name AS "providerName", p.category,
         p.image_url AS "imageUrl", b.service_date AS "serviceDate",
         b.price, b.paid_amount AS "paidAmount", b.status
       FROM bookings b
       JOIN providers p ON p.id = b.provider_id
       JOIN events e ON e.id = b.event_id
       WHERE b.event_id = $1 AND e.user_id = $2
       ORDER BY b.created_at DESC`,
      [req.params.id, req.user.id]
    );

    res.json({
      ...result.rows[0],
      bookings: bookings.rows
    });
  } catch (err) {
    next(err);
  }
});

// PUT /events/:id — modifica un evento
router.put("/:id", async (req, res, next) => {
  try {
    const error = validateEvent(req.body, true);
    if (error) return res.status(400).json({ error });

    const columns = {
      name: "name",
      eventType: "event_type",
      date: "date",
      time: "time",
      location: "location",
      guests: "guests",
      budget: "budget",
      status: "status"
    };

    const entries = Object.entries(req.body)
      .filter(([key]) => columns[key]);

    if (!entries.length) {
      return res.status(400).json({
        error: "Nessun campo valido da aggiornare"
      });
    }

    const values = [];
    const assignments = entries.map(([key, value], index) => {
      values.push(
        ["guests", "budget"].includes(key) ? Number(value) :
        key === "name" ? value.trim() : value
      );
      return `${columns[key]} = $${index + 1}`;
    });

    values.push(req.params.id, req.user.id);

    const result = await db.query(
      `UPDATE events SET ${assignments.join(", ")}
       WHERE id = $${values.length - 1}
         AND user_id = $${values.length}
       RETURNING id, name, event_type AS "eventType",
         date, time, location, guests, budget, status`,
      values
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Evento non trovato" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /events/:id — elimina solo se non ha prenotazioni
router.delete("/:id", async (req, res, next) => {
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const event = await client.query(
      `SELECT id FROM events
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [req.params.id, req.user.id]
    );

    if (!event.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Evento non trovato" });
    }

    const bookings = await client.query(
      `SELECT id FROM bookings
       WHERE event_id = $1
       LIMIT 1`,
      [req.params.id]
    );

    if (bookings.rowCount) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Impossibile eliminare un evento con prenotazioni. Annullale prima."
      });
    }

    await client.query(
      "DELETE FROM events WHERE id = $1",
      [req.params.id]
    );

    await client.query("COMMIT");
    res.status(204).send();
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
