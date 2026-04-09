const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    changedByRole: {
      type: String,
      default: "citizen",
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    referenceCode: {
      type: String,
      unique: true,
      default: () =>
        `CIV-${Date.now().toString(36).toUpperCase()}-${Math.floor(
          100 + Math.random() * 900
        )}`,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    phone: { type: String, default: null },
    email: { type: String, required: true, trim: true, lowercase: true },
    reporterName: { type: String, default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    location: { type: String, required: true, trim: true },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    category: {
      type: String,
      enum: ["Roads", "Lighting", "Water", "Waste", "Safety", "Public Spaces", "Transport", "Other"],
      default: "Other",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    department: {
      type: String,
      default: "Civic Operations",
    },
    fileUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },
    notifyByEmail: {
      type: Boolean,
      default: false,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    votedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [
        {
          status: "Pending",
          note: "Issue submitted by citizen",
          changedByRole: "citizen",
        },
      ],
    },
  },
  { timestamps: true }
);

issueSchema.index({ createdAt: -1 });
issueSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model("Issue", issueSchema);
