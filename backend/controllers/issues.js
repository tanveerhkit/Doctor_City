const mongoose = require("mongoose");
const xss = require("xss");
const Issue = require("../models/issues");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");
const { asyncHandler } = require("../utils/asyncHandler");
const { uploadOnCloudinary } = require("../utils/cloudinary.js");

const STATUS_VALUES = ["Pending", "In Progress", "Resolved", "Rejected"];
const CATEGORY_VALUES = [
  "Roads",
  "Lighting",
  "Water",
  "Waste",
  "Safety",
  "Public Spaces",
  "Transport",
  "Other",
];
const PRIORITY_VALUES = ["Low", "Medium", "High"];

const toBoolean = (value) => value === true || value === "true";

const sanitizeText = (value) =>
  value === undefined || value === null ? "" : xss(String(value).trim());

const sanitizeOptionalText = (value) => {
  const sanitizedValue = sanitizeText(value);
  return sanitizedValue || null;
};

const toNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveDepartment = (category) => {
  switch (category) {
    case "Roads":
      return "Road Maintenance";
    case "Lighting":
      return "Electrical Services";
    case "Water":
      return "Water Board";
    case "Waste":
      return "Sanitation";
    case "Safety":
      return "Public Safety";
    case "Public Spaces":
      return "Parks & Recreation";
    case "Transport":
      return "Traffic Management";
    default:
      return "Civic Operations";
  }
};

const buildIssueResponse = (issue, viewer = null) => {
  const voteUserIds = (issue.votedBy || []).map((entry) => String(entry));
  const viewerIdString = viewer?.sub ? String(viewer.sub) : null;
  const viewerRole = viewer?.role || null;
  const canViewSensitive =
    viewerRole === "admin" ||
    (viewerIdString ? String(issue.owner) === viewerIdString : false);

  return {
    id: String(issue._id),
    referenceCode: issue.referenceCode,
    title: issue.title,
    description: issue.description,
    phone: canViewSensitive ? issue.phone : null,
    email: canViewSensitive ? issue.email : null,
    reporterName: issue.reporterName,
    ownerId: issue.owner ? String(issue.owner) : null,
    location: issue.location,
    coordinates:
      issue.coordinates?.lat != null && issue.coordinates?.lng != null
        ? issue.coordinates
        : null,
    category: issue.category,
    priority: issue.priority,
    department: issue.department,
    fileUrl: issue.fileUrl,
    status: issue.status,
    notifyByEmail: issue.notifyByEmail,
    upvotes: issue.upvotes || 0,
    hasVoted: viewerIdString ? voteUserIds.includes(viewerIdString) : false,
    isOwner: viewerIdString ? String(issue.owner) === viewerIdString : false,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    statusHistory: (issue.statusHistory || []).map((entry) => ({
      status: entry.status,
      note: entry.note,
      changedByRole: entry.changedByRole,
      changedAt: entry.changedAt,
    })),
  };
};

const ensureValidObjectId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid issue ID format" });
    return false;
  }

  return true;
};

const findAuthenticatedUser = async (req) => {
  if (!req.user?.sub || !mongoose.Types.ObjectId.isValid(req.user.sub)) {
    return null;
  }

  return User.findById(req.user.sub);
};

const uploadIssueAttachment = async (req) => {
  if (!req.file?.path) {
    return null;
  }

  const uploadResponse = await uploadOnCloudinary(req.file.path);
  return uploadResponse?.secure_url || null;
};

const createIssue = asyncHandler(async (req, res) => {
  const currentUser = await findAuthenticatedUser(req);

  const title = sanitizeText(req.body.title);
  const description = sanitizeText(req.body.description);
  const location = sanitizeText(req.body.location);
  const phone = sanitizeOptionalText(req.body.phone);
  const email = sanitizeOptionalText(req.body.email) || currentUser?.email || null;
  const reporterName =
    sanitizeOptionalText(req.body.reporterName) ||
    currentUser?.name ||
    (email ? email.split("@")[0] : "Citizen");
  const category = CATEGORY_VALUES.includes(req.body.category)
    ? req.body.category
    : "Other";
  const priority = PRIORITY_VALUES.includes(req.body.priority)
    ? req.body.priority
    : "Medium";
  const notifyByEmail = toBoolean(req.body.notifyByEmail);
  const lat = toNumber(req.body.lat);
  const lng = toNumber(req.body.lng);

  if (!title || !description || !location || !email) {
    return res.status(400).json({
      error: "Title, description, location, and email are required",
    });
  }

  const fileUrl = await uploadIssueAttachment(req);

  const issue = await Issue.create({
    title,
    description,
    phone,
    email,
    reporterName,
    owner: currentUser?._id || null,
    location,
    coordinates:
      lat != null && lng != null ? { lat, lng } : { lat: null, lng: null },
    category,
    priority,
    department: resolveDepartment(category),
    notifyByEmail,
    fileUrl,
  });

  return res.status(201).json({
    message: "Issue submitted successfully",
    issue: buildIssueResponse(issue, req.user),
  });
});

const getAllIssues = asyncHandler(async (req, res) => {
  const { mine, status, category, q, sort = "newest", limit } = req.query;
  const query = {};

  if (mine === "true") {
    if (!req.user?.sub) {
      return res
        .status(401)
        .json({ error: "Login required to view your issues" });
    }

    query.owner = req.user.sub;
  }

  if (STATUS_VALUES.includes(status)) {
    query.status = status;
  }

  if (CATEGORY_VALUES.includes(category)) {
    query.category = category;
  }

  if (q) {
    const safeQuery = escapeRegex(sanitizeText(q));
    query.$or = [
      { title: { $regex: safeQuery, $options: "i" } },
      { description: { $regex: safeQuery, $options: "i" } },
      { location: { $regex: safeQuery, $options: "i" } },
      { referenceCode: { $regex: safeQuery, $options: "i" } },
    ];
  }

  let mongoQuery = Issue.find(query);

  if (sort === "popular") {
    mongoQuery = mongoQuery.sort({ upvotes: -1, createdAt: -1 });
  } else if (sort === "oldest") {
    mongoQuery = mongoQuery.sort({ createdAt: 1 });
  } else {
    mongoQuery = mongoQuery.sort({ createdAt: -1 });
  }

  const numericLimit = Number(limit);
  if (Number.isFinite(numericLimit) && numericLimit > 0) {
    mongoQuery = mongoQuery.limit(Math.min(numericLimit, 100));
  }

  const issues = await mongoQuery.exec();

  return res.json(issues.map((issue) => buildIssueResponse(issue, req.user)));
});

const getIssueById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!ensureValidObjectId(id, res)) {
    return;
  }

  const issue = await Issue.findById(id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  return res.json(buildIssueResponse(issue, req.user));
});

const updateIssueStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const newStatus = sanitizeText(req.body.newStatus);
  const note = sanitizeOptionalText(req.body.note);

  if (!ensureValidObjectId(id, res)) {
    return;
  }

  if (!STATUS_VALUES.includes(newStatus)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const issue = await Issue.findById(id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  issue.status = newStatus;
  issue.statusHistory.push({
    status: newStatus,
    note: note || `Status updated to ${newStatus}`,
    changedByRole: req.user?.role || "admin",
  });
  await issue.save();

  if (issue.notifyByEmail && issue.email) {
    await sendEmail(
      issue.email,
      "Doctor City - Issue Status Update",
      `<p>Your issue <strong>${issue.title}</strong> is now <strong>${newStatus}</strong>.</p>${
        note ? `<p>Update: ${note}</p>` : ""
      }`
    );
  }

  return res.json({
    message: "Status updated successfully",
    issue: buildIssueResponse(issue, req.user),
  });
});

const toggleVote = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!ensureValidObjectId(id, res)) {
    return;
  }

  const issue = await Issue.findById(id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const viewerId = String(req.user.sub);
  const existingIndex = (issue.votedBy || []).findIndex(
    (entry) => String(entry) === viewerId
  );

  if (existingIndex >= 0) {
    issue.votedBy.splice(existingIndex, 1);
    issue.upvotes = Math.max(0, (issue.upvotes || 0) - 1);
  } else {
    issue.votedBy.push(req.user.sub);
    issue.upvotes = (issue.upvotes || 0) + 1;
  }

  await issue.save();

  return res.json({
    message: existingIndex >= 0 ? "Vote removed" : "Vote recorded",
    issue: buildIssueResponse(issue, req.user),
  });
});

const deleteIssue = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!ensureValidObjectId(id, res)) {
    return;
  }

  const issue = await Issue.findById(id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const isOwner = req.user?.sub && String(issue.owner) === String(req.user.sub);
  const isAdmin = req.user?.role === "admin";

  if (!isOwner && !isAdmin) {
    return res
      .status(403)
      .json({ error: "You do not have permission to delete this issue" });
  }

  await issue.deleteOne();

  return res.json({ message: "Issue deleted successfully" });
});

const updateIssue = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!ensureValidObjectId(id, res)) {
    return;
  }

  const issue = await Issue.findById(id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const isOwner = req.user?.sub && String(issue.owner) === String(req.user.sub);
  const isAdmin = req.user?.role === "admin";

  if (!isOwner && !isAdmin) {
    return res
      .status(403)
      .json({ error: "You do not have permission to update this issue" });
  }

  const nextTitle = sanitizeOptionalText(req.body.title);
  const nextDescription = sanitizeOptionalText(req.body.description);
  const nextPhone = sanitizeOptionalText(req.body.phone);
  const nextEmail = sanitizeOptionalText(req.body.email);
  const nextLocation = sanitizeOptionalText(req.body.location);
  const nextCategory = CATEGORY_VALUES.includes(req.body.category)
    ? req.body.category
    : null;
  const nextPriority = PRIORITY_VALUES.includes(req.body.priority)
    ? req.body.priority
    : null;
  const nextLat = toNumber(req.body.lat);
  const nextLng = toNumber(req.body.lng);
  const nextFileUrl = await uploadIssueAttachment(req);

  if (nextTitle) issue.title = nextTitle;
  if (nextDescription) issue.description = nextDescription;
  if (nextPhone !== null) issue.phone = nextPhone;
  if (nextEmail) issue.email = nextEmail;
  if (nextLocation) issue.location = nextLocation;
  if (nextCategory) {
    issue.category = nextCategory;
    issue.department = resolveDepartment(nextCategory);
  }
  if (nextPriority) issue.priority = nextPriority;
  if (nextLat != null && nextLng != null) {
    issue.coordinates = { lat: nextLat, lng: nextLng };
  }
  if (nextFileUrl) issue.fileUrl = nextFileUrl;
  if (req.body.notifyByEmail !== undefined) {
    issue.notifyByEmail = toBoolean(req.body.notifyByEmail);
  }

  await issue.save();

  return res.json({
    message: "Issue updated successfully",
    issue: buildIssueResponse(issue, req.user),
  });
});

module.exports = {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssueStatus,
  toggleVote,
  deleteIssue,
  updateIssue,
};

