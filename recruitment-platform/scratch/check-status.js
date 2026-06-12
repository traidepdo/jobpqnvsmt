async function checkUrl() {
  const url = "https://res.cloudinary.com/dl0ysjb7l/image/upload/v1780997481/cv-documents/iqyjfnbfcs3tzmtcviud.pdf";
  console.log("Checking URL:", url);
  try {
    const res = await fetch(url, { method: "HEAD" });
    console.log("Status:", res.status);
  } catch (err) {
    console.error(err);
  }
}
checkUrl();
