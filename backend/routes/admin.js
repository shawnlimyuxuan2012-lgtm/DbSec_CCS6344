const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  getAuditLogs,
  purgeRecords,
} = require("../controllers/adminController");

router.use(authenticate, authorize("admin"));

router.get("/users", getUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.patch("/users/:id", deactivateUser);
router.delete("/users/:id", deleteUser);
router.get("/audit-logs", getAuditLogs);
router.delete("/purge-records", purgeRecords);

module.exports = router;
