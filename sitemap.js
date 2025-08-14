// server/sitemaps.js
import express from "express";
import axios from "axios";

const router = express.Router();
const baseUrl = "https://taskncart.shop"; // change to your actual domain

// Main sitemap index
router.get("/sitemap.xml", (req, res) => {
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap>
        <loc>${baseUrl}/sitemap-static.xml</loc>
      </sitemap>
      <sitemap>
        <loc>${baseUrl}/sitemap-products.xml</loc>
      </sitemap>
    </sitemapindex>
  `;

  res.header("Content-Type", "application/xml");
  res.send(sitemapIndex);
});

// Static pages sitemap
router.get("/sitemap-static.xml", (req, res) => {
  const staticPages = [
    "",
    "about-us",
    "terms",
    "disclaimer",
    "category/products",
    "category/jobvacancy",
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticPages
        .map(
          (page) => `
          <url>
            <loc>${baseUrl}/${page}</loc>
            <lastmod>${new Date().toISOString()}</lastmod>
            <changefreq>monthly</changefreq>
            <priority>0.7</priority>
          </url>
        `
        )
        .join("")}
    </urlset>
  `;

  res.header("Content-Type", "application/xml");
  res.send(sitemap);
});

// Product pages sitemap
router.get("/sitemap-products.xml", async (req, res) => {
  try {
    const { data: products } = await axios.get(
      "https://ecommerce-server-or19.onrender.com/api/products"
    );

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${products
          .map(
            (p) => `
            <url>
              <loc>${baseUrl}/product/${p._id}</loc>
              <lastmod>${new Date(
                p.updatedAt || Date.now()
              ).toISOString()}</lastmod>
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
    res.status(500).send("Error generating product sitemap");
  }
});

export default router;
