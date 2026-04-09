const mongoose = require("mongoose");
const { seedPrototypeData } = require("../db/seedPrototypeData");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log(" MongoDB connected");
    await seedPrototypeData();
  })
  .catch((err) => console.error(" MongoDB connection error:", err));
