const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: "dl0ysjb7l",
    api_key: "993544998876154",
    api_secret: "0fmwzdHqkHulxdLLxgWZmu2Trrc",
});

async function runTest() {
  try {
    const filePath = "C:\\Users\\ngoan\\AppData\\Local\\Temp\\Zalo Temp\\TempDownloads\\Nguyen-Van-Ngoan.pdf";
    console.log("Reading file from:", filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString("base64");
    const dataUri = `data:application/pdf;base64,${base64}`;

    console.log("Uploading to Cloudinary as resource_type: 'image'...");
    const result = await cloudinary.uploader.upload(dataUri, {
        folder: "cv-documents",
        resource_type: "image",
    });

    console.log("Upload Success!");
    console.log("URL:", result.secure_url);
    console.log("Public ID:", result.public_id);
  } catch (error) {
    console.error("Upload failed:", error);
  }
}

runTest();
