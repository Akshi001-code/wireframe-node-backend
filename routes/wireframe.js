const express = require('express');
const router = express.Router();
const axios = require('axios');
const { enhanceHtmlWithGPT } = require('../utils/openaiEnhancer');

// Configuration for APIs
const HUGGINGFACE_SPACE_URL = 'https://akshi12-wireframegenerator.hf.space';

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
            try {
                console.log('Calling Hugging Face Space API...');
                // Call Hugging Face Space API
                const response = await axios.post(`${HUGGINGFACE_SPACE_URL}/run/predict`, {
                    data: [
                        prompt,
                        primaryColor || '#2196F3' // Default to blue if no color provided
                    ]
                });

                console.log('Hugging Face response:', response.data);

                if (response.data && Array.isArray(response.data.data) && response.data.data.length >= 2) {
                    // The response contains both preview_html and refined_html
                    refined_html = response.data.data[1]; // Get the refined HTML
                } else {
                    console.error('Invalid response structure:', response.data);
                    throw new Error('Invalid response from Hugging Face Space');
                }
            } catch (error) {
                console.error('Hugging Face Space error:', error.response?.data || error.message);
                throw new Error('Failed to generate wireframe: ' + (error.response?.data?.error || error.message));
            }
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