
module.exports = function auth(req, res, next) {
  const userId = req.header("x-user-id") || "1";

  if (!/^\d+$/.test(userId) || Number(userId) < 1) {
    return res.status(401).json({ error: "Invalid user" });
  }

  req.user = { id: userId };
  next();
};
