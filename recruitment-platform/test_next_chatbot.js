const fs = require('fs');

async function run() {
  const dummy_pdf_content = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 72 712 Td (Hello World NodeJS Developer) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000223 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n318\n%%EOF"
  );
  
  const formData = new FormData();
  const blob = new Blob([dummy_pdf_content], { type: 'application/pdf' });
  formData.append('file', blob, 'test_cv.pdf');

  try {
    const response = await fetch("http://localhost:3000/api/public/chatbot", {
      method: "POST",
      body: formData,
    });
    console.log("Status Code:", response.status_code || response.status);
    const text = await response.text();
    console.log("Response Body:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
