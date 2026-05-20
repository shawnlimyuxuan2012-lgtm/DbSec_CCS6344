require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Trust proxy for correct IP addresses behind Vite dev proxy / nginx
app.set("trust proxy", 1);

function normalizeIp(ip) {
  if (!ip) return "0.0.0.0";
  // Strip IPv6 prefix and handle loopback
  const cleaned = ip.replace(/^::ffff:/, "").trim();
  return cleaned === "::1" ? "127.0.0.1" : cleaned;
}

// Middleware to ensure IP is captured correctly from proxy headers
app.use((req, res, next) => {
  const rawIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "0.0.0.0";
  const realIp = normalizeIp(rawIp);
  // Replace req.ip with the real client IP
  Object.defineProperty(req, "ip", {
    get() {
      return realIp;
    },
    configurable: true,
  });
  next();
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads (restrict access in production)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/student", require("./routes/student"));
app.use("/api/lecturer", require("./routes/lecturer"));
app.use("/api/admin", require("./routes/admin"));

// Health check
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date() }),
);

// 404 handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload path: ${process.env.UPLOAD_PATH || "./uploads"}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}\n`);
});
