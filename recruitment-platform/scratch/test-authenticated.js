const fs = require('fs');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: "dl0ysjb7l",
    api_key: "993544998876154",
    api_secret: "0fmwzdHqkHulxdLLxgWZmu2Trrc",
});

async function runTest() {
  try {
    const filePath = "C:\\Users\\ngoan\\AppData\\Local\\Temp\\Zalo Temp\\TempDownloads\\Nguyen-Van-Ngoan.pdf";
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString("base64");
    const dataUri = `data:application/pdf;base64,${base64}`;

    console.log("Uploading with type: 'authenticated'...");
    const result = await cloudinary.uploader.upload(dataUri, {
        folder: "cv-documents",
        resource_type: "raw",
        type: "authenticated",
    });

    console.log("Uploaded! Public ID:", result.public_id);
    console.log("Default secure URL:", result.secure_url);

    // Generate signed URL
    const signedUrl = cloudinary.url(result.public_id, {
      resource_type: "raw",
      type: "authenticated",
      sign_url: true,
      secure: true,
    });
    console.log("Signed URL:", signedUrl);

    const res = await fetch(signedUrl, { method: "HEAD" });
    console.log("Status:", res.status);
  } catch (error) {
    console.error("Failed:", error);
  }
}
runTest();
