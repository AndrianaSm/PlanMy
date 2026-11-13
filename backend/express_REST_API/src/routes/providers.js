
const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /providers?category=CATERING&location=Zurich&guests=80&maxPrice=1500
router.get("/", async (req, res, next) => {
  try {
    const conditions = [];
    const params = [];

    if (req.query.category) {
      params.push(req.query.category);
      conditions.push(`category = $${params.length}`);
    }

    if (req.query.location) {
      params.push(`%${req.query.location}%`);
      conditions.push(`location ILIKE $${params.length}`);
    }

    if (req.query.guests) {
      const guests = Number(req.query.guests);

      if (!Number.isInteger(guests) || guests < 1) {
        return res.status(400).json({ error: "Numero invitati non valido" });
      }

      params.push(guests);
      conditions.push(`(max_guests IS NULL OR max_guests >= $${params.length})`);
    }

    if (req.query.maxPrice !== undefined) {
      const maxPrice = Number(req.query.maxPrice);

      if (!Number.isFinite(maxPrice) || maxPrice < 0) {
        return res.status(400).json({ error: "Prezzo massimo non valido" });
      }

      params.push(maxPrice);
      conditions.push(`price <= $${params.length}`);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const result = await db.query(
      `SELECT id, name, category, description,
         image_url AS "imageUrl", location, rating,
         review_count AS "reviewCount", price,
         price_unit AS "priceUnit",
         max_guests AS "maxGuests"
       FROM providers
       ${where}
       ORDER BY rating DESC NULLS LAST, name ASC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /providers/:id — dettaglio provider
router.get("/:id", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, category, description,
         image_url AS "imageUrl", location, rating,
         review_count AS "reviewCount", price,
         price_unit AS "priceUnit",
         max_guests AS "maxGuests"
       FROM providers
       WHERE id = $1`,
      [req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Provider non trovato" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
