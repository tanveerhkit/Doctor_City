const express = require("express");
const router = express.Router();
const issueController = require("../controllers/issues");
const { verifyToken, optionalVerifyToken, isAdmin } = require("../middlewares/validate");
const upload = require("../middlewares/upload");

router.post("/", optionalVerifyToken, upload.single("file"), issueController.createIssue);
router.post("/:id/vote", verifyToken, issueController.toggleVote);
router.patch("/:id/status", verifyToken, isAdmin, issueController.updateIssueStatus);
router.patch("/:id", verifyToken, upload.single("file"), issueController.updateIssue);
router.delete("/:id", verifyToken, issueController.deleteIssue);
router.get("/", optionalVerifyToken, issueController.getAllIssues);
router.get("/:id", optionalVerifyToken, issueController.getIssueById);

module.exports = router;
