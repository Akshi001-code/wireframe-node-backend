const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { enhanceHtmlWithGPT } = require('../utils/openaiEnhancer');

router.post('/html-to-image', async (req, res) => {
  const { html, prompt, primaryColor } = req.body;
  if (!html || !prompt || !primaryColor) {
    return res.status(400).json({ success: false, message: 'HTML, prompt, and primaryColor are required' });
  }

  try {
    // 1. Enhance HTML with OpenAI
    const enhancedHtml = await enhanceHtmlWithGPT(html, prompt, primaryColor);

    // 2. Generate image from enhanced HTML
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(enhancedHtml, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: 400, height: 300 });
    const filename = `wireframe_${Date.now()}.png`;
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
    const filepath = path.join(publicDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    await browser.close();
    res.json({
      success: true,
      imageUrl: `/public/${filename}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 