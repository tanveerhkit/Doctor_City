const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const deleteLocalFile = (localFilePath) => {
  fs.unlink(localFilePath, (error) => {
    if (error) {
      console.error("Error deleting local file:", error);
    }
  });
};

const buildLocalFileResponse = (localFilePath) => {
  const filename = path.basename(localFilePath);
  const port = process.env.PORT || 5000;

  return {
    provider: "local",
    secure_url: `http://localhost:${port}/uploads/${encodeURIComponent(filename)}`,
  };
};

const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) {
    return null;
  }

  if (!hasCloudinaryConfig) {
    return buildLocalFileResponse(localFilePath);
  }

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    deleteLocalFile(localFilePath);
    return response;
  } catch (error) {
    console.error("Cloudinary error, falling back to local file:", error.message);
    return buildLocalFileResponse(localFilePath);
  }
};

module.exports = { uploadOnCloudinary };
