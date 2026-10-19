
const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /conversations
router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
         c.id,
         c.event_id AS "eventId",
         e.name AS "eventName",
         c.provider_id AS "providerId",
         p.name AS "providerName",
         p.image_url AS "providerImageUrl",
         last_message.text AS "lastMessage",
         last_message.created_at AS "lastMessageAt"
       FROM conversations c
       JOIN events e ON e.id = c.event_id
       JOIN providers p ON p.id = c.provider_id
       LEFT JOIN LATERAL (
         SELECT m.text, m.created_at
         FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY m.created_at DESC, m.id DESC
         LIMIT 1
       ) last_message ON TRUE
       WHERE e.user_id = $1
       ORDER BY last_message.created_at DESC NULLS LAST, c.id DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
