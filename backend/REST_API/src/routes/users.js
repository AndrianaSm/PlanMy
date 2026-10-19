
const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /users/me
router.get("/me", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, email,
         profile_image_url AS "profileImageUrl"
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
