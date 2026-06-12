const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: "dl0ysjb7l",
    api_key: "993544998876154",
    api_secret: "0fmwzdHqkHulxdLLxgWZmu2Trrc",
});

async function runTest() {
  try {
    // base64 1x1 transparent pixel image
    const dataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const result = await cloudinary.uploader.upload(dataUri, {
        folder: "cv-avatars",
    });
    console.log("Image URL:", result.secure_url);
    const res = await fetch(result.secure_url, { method: "HEAD" });
    console.log("Status:", res.status);
  } catch (error) {
    console.error("Failed:", error);
  }
}
runTest();
