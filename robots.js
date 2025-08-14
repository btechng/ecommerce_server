// server/robots.js
import express from "express";

const router = express.Router();
const baseUrl = "https://taskncart.shop"; // change to your real domain

router.get("/robots.txt", (req, res) => {
  const content = `
User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
  `.trim();

  res.type("text/plain").send(content);
});

export default router;
