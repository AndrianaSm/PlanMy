
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const auth = require("./middleware/auth");

const eventsRouter = require("./routes/events");
const providersRouter = require("./routes/providers");
const bookingsRouter = require("./routes/bookings");
const conversationsRouter = require("./routes/conversations");
const usersRouter = require("./routes/users");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(auth);

app.use("/events", eventsRouter);
app.use("/providers", providersRouter);
app.use("/events", bookingsRouter);
app.use("/conversations", conversationsRouter);
app.use("/users", usersRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint non trovato" });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) return next(err);

  res.status(500).json({ error: "Errore interno del server" });
});

module.exports = app;
