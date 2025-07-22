const express = require('express');
const router = express.Router();
const axios = require('axios');
const { enhanceHtmlWithGPT } = require('../utils/openaiEnhancer');

// Configuration for Python API
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5000';

/**
 * @route   POST /api/wireframe/generate
 * @desc    Generate wireframe HTML from prompt using either Python model or AI
 * @access  Private
 */
router.post('/generate', async (req, res) => {
    try {
        const { prompt, method = 'python', primaryColor } = req.body;

        if (!prompt) {
            return res.status(400).json({ 
                success: false, 
                message: 'Prompt is required' 
            });
        }

        if (!['python', 'ai'].includes(method)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid generation method. Must be either "python" or "ai"'
            });
        }

        let refined_html;

        if (method === 'python') {
            // Call Python API for wireframe generation
            const response = await axios.post(`${PYTHON_API_URL}/generate`, {
                prompt
            });
            refined_html = response.data.refined_html;
        } else {
            // Use OpenAI directly for wireframe generation
            refined_html = await enhanceHtmlWithGPT(
                '<div class="wireframe-container"></div>', // Base HTML template
                prompt,
                primaryColor
            );
        }

        // Return the generated wireframe
        res.json({
            success: true,
            data: {
                refined_html: refined_html
            }
        });

    } catch (error) {
        console.error('Wireframe generation error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error generating wireframe',
            error: error.response?.data || error.message
        });
    }
});

module.exports = router; 