const Issue = require("../models/issues");

const prototypeIssues = [
  {
    referenceCode: "CIV-DEMO-001",
    title: "Pothole near City Bus Stop",
    description:
      "A deep pothole has formed in the left lane near the main bus stop and is causing vehicles to swerve during peak hours.",
    email: "citizen-demo@doctorcity.local",
    reporterName: "Prototype Citizen",
    location: "M.G. Road Bus Stop, Bengaluru",
    coordinates: { lat: 12.9757, lng: 77.6055 },
    category: "Roads",
    priority: "High",
    department: "Road Maintenance",
    status: "In Progress",
    upvotes: 21,
    statusHistory: [
      {
        status: "Pending",
        note: "Issue submitted by citizen",
        changedByRole: "citizen",
      },
      {
        status: "In Progress",
        note: "Repair crew assigned for inspection",
        changedByRole: "admin",
      },
    ],
  },
  {
    referenceCode: "CIV-DEMO-002",
    title: "Streetlight outage outside public park",
    description:
      "Three streetlights are out near the park entrance, making the walkway unsafe after 7 PM.",
    email: "citizen-demo@doctorcity.local",
    reporterName: "Prototype Citizen",
    location: "Indiranagar Community Park, Bengaluru",
    coordinates: { lat: 12.9719, lng: 77.6412 },
    category: "Lighting",
    priority: "Medium",
    department: "Electrical Services",
    status: "Pending",
    upvotes: 14,
  },
  {
    referenceCode: "CIV-DEMO-003",
    title: "Overflowing garbage point in market lane",
    description:
      "Waste has not been cleared for two days and nearby shops are reporting strong odor and stray animals around the bin.",
    email: "citizen-demo@doctorcity.local",
    reporterName: "Prototype Citizen",
    location: "KR Market Service Lane, Bengaluru",
    coordinates: { lat: 12.958, lng: 77.5771 },
    category: "Waste",
    priority: "High",
    department: "Sanitation",
    status: "Pending",
    upvotes: 26,
  },
  {
    referenceCode: "CIV-DEMO-004",
    title: "Water leakage beside residential block",
    description:
      "A continuous leak from the roadside valve is wasting water and creating a slippery patch in front of the apartment gate.",
    email: "citizen-demo@doctorcity.local",
    reporterName: "Prototype Citizen",
    location: "HSR Layout Sector 2, Bengaluru",
    coordinates: { lat: 12.9116, lng: 77.6474 },
    category: "Water",
    priority: "Medium",
    department: "Water Board",
    status: "Resolved",
    upvotes: 9,
    statusHistory: [
      {
        status: "Pending",
        note: "Leak reported by resident",
        changedByRole: "citizen",
      },
      {
        status: "Resolved",
        note: "Valve replaced and area cleaned",
        changedByRole: "admin",
      },
    ],
  },
  {
    referenceCode: "CIV-DEMO-005",
    title: "Broken railing near pedestrian bridge",
    description:
      "The side railing on the footbridge is detached over a two-meter section and needs urgent safety barricading.",
    email: "citizen-demo@doctorcity.local",
    reporterName: "Prototype Citizen",
    location: "Yeshwanthpur Pedestrian Bridge, Bengaluru",
    coordinates: { lat: 13.0266, lng: 77.5409 },
    category: "Safety",
    priority: "High",
    department: "Public Safety",
    status: "Pending",
    upvotes: 18,
  },
  {
    referenceCode: "CIV-DEMO-006",
    title: "Damaged bench and litter in neighborhood park",
    description:
      "Two benches are damaged and the children’s play area has not been cleaned since the weekend.",
    email: "citizen-demo@doctorcity.local",
    reporterName: "Prototype Citizen",
    location: "JP Nagar Mini Park, Bengaluru",
    coordinates: { lat: 12.9081, lng: 77.5856 },
    category: "Public Spaces",
    priority: "Low",
    department: "Parks & Recreation",
    status: "In Progress",
    upvotes: 7,
  },
];

const seedPrototypeData = async () => {
  const operations = prototypeIssues.map((issue) => ({
    updateOne: {
      filter: { referenceCode: issue.referenceCode },
      update: { $setOnInsert: issue },
      upsert: true,
    },
  }));

  const result = await Issue.bulkWrite(operations, { ordered: false });
  const insertedCount = (result.upsertedCount || 0);

  if (insertedCount > 0) {
    console.log(`Seeded ${insertedCount} prototype issues`);
  }
};

module.exports = {
  seedPrototypeData,
};

