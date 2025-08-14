// server/sitemap.js
import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = "https://taskncart.shop"; // change to your actual domain

    // Fetch all products from your existing API
    const { data: products } = await axios.get(
      "https://ecommerce-server-or19.onrender.com/api/products"
    );

    // Static pages
    const staticPages = [
      "",
      "about-us",
      "terms",
      "disclaimer",
      "category/products",
      "category/jobvacancy",
    ];

    // Generate XML
    const urls = [
      ...staticPages.map((page) => `${baseUrl}/${page}`),
      ...products.map((p) => `${baseUrl}/product/${p._id}`),
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls
          .map(
            (url) => `
            <url>
              <loc>${url}</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>0.8</priority>
            </url>
          `
          )
          .join("")}
      </urlset>
    `;

    res.header("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating sitemap");
  }
});

export default router;
