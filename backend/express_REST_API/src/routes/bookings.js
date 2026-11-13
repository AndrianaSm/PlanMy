
const express = require("express");
const db = require("../db");

const router = express.Router();

// POST /events/:id/bookings
router.post("/:id/bookings", async (req, res, next) => {
  const { providerId, serviceDate, price } = req.body;

  if (!providerId || !Number.isInteger(Number(providerId)) ||
      Number(providerId) < 1) {
    return res.status(400).json({ error: "providerId non valido" });
  }

  if (price === undefined ||
      !Number.isFinite(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ error: "Prezzo non valido" });
  }

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const event = await client.query(
      `SELECT id, status FROM events
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [req.params.id, req.user.id]
    );

    if (!event.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Evento non trovato" });
    }

    if (event.rows[0].status === "CANCELLED") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Non puoi prenotare servizi per un evento annullato"
      });
    }

    const provider = await client.query(
      "SELECT id FROM providers WHERE id = $1",
      [Number(providerId)]
    );

    if (!provider.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Provider non trovato" });
    }

    const booking = await client.query(
      `INSERT INTO bookings
         (event_id, provider_id, service_date, price, status)
       VALUES ($1, $2, $3, $4, 'CONFIRMED')
       RETURNING id, event_id AS "eventId",
         provider_id AS "providerId",
         service_date AS "serviceDate", price, status,
         created_at AS "createdAt"`,
      [
        req.params.id,
        Number(providerId),
        serviceDate || null,
        Number(price)
      ]
    );

    await client.query("COMMIT");
    res.status(201).json(booking.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");

    if (err.code === "23505") {
      return res.status(409).json({
        error: "Questo provider è già prenotato per l'evento"
      });
    }

    if (err.code === "23503") {
      return res.status(400).json({
        error: "Evento o provider non valido"
      });
    }

    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
