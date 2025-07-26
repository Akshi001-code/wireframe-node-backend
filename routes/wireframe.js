const express = require('express');
const router = express.Router();
const axios = require('axios');
const { enhanceHtmlWithGPT } = require('../utils/openaiEnhancer');
const WireframeGeneration = require('../models/WireframeGeneration');

// Configuration for APIs
const HUGGINGFACE_SPACE_URL = 'https://akshi12-wireframegenerator.hf.space';

/**
 * @route   POST /api/wireframe/generate
 * @desc    Generate wireframe HTML from prompt using either Python model or AI
 * @access  Private
 */
router.post('/generate', async (req, res) => {
    try {
        const { prompt, method = 'python', primaryColor, projectId } = req.body;

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
                console.log('Calling Hugging Face Space API with data:', {
                    prompt,
                    primaryColor: primaryColor || '#2196F3'
                });

                // Make the prediction request using the api/predict endpoint
                const response = await axios.post(`${HUGGINGFACE_SPACE_URL}/api/predict`, {
                    data: [
                        prompt,
                        primaryColor || '#2196F3'
                    ]
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000 // 60 second timeout since model loading might take time
                });

                console.log('Hugging Face raw response:', response.data);

                if (response.data && response.data.data) {
                    refined_html = response.data.data[1] || response.data.data[0];
                    if (typeof refined_html !== 'string') {
                        console.error('Unexpected response format:', refined_html);
                        refined_html = JSON.stringify(refined_html);
                    }
                } else if (response.data && response.data.error) {
                    throw new Error(`API Error: ${response.data.error}`);
                } else {
                    console.error('Unexpected response structure:', response.data);
                    throw new Error('Invalid response format from Hugging Face Space');
                }
            } catch (error) {
                console.error('Hugging Face Space detailed error:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                    headers: error.response?.headers
                });

                // Try to provide a more helpful error message
                let errorMessage = 'Failed to generate wireframe: ';
                if (error.response?.data?.error) {
                    errorMessage += error.response.data.error;
                } else if (error.response?.status === 500) {
                    errorMessage += 'Internal server error in Hugging Face Space';
                } else if (error.code === 'ECONNABORTED') {
                    errorMessage += 'Request timed out';
                } else {
                    errorMessage += error.message;
                }

                throw new Error(errorMessage);
            }
        } else {
            // Use OpenAI directly for wireframe generation
            refined_html = await enhanceHtmlWithGPT(
                '<div class="wireframe-container"></div>',
                prompt,
                primaryColor
            );
        }

        // Return the generated wireframe
        // Save generation record if projectId is provided
        if (projectId) {
            try {
                await WireframeGeneration.create({
                    projectId,
                    prompt
                });
            } catch (err) {
                console.error('Failed to save wireframe generation record:', err);
            }
        }
        res.json({
            success: true,
            data: {
                refined_html: refined_html
            }
        });

    } catch (error) {
        console.error('Wireframe generation error:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error generating wireframe',
            error: error.message,
            details: error.response?.data || 'No additional details available'
        });
    }
});

// Endpoint to get wireframe generation count for a project
router.get('/count/:projectId', async (req, res) => {
    try {
        const count = await WireframeGeneration.countDocuments({ projectId: req.params.projectId });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get wireframe generation count' });
    }
});

module.exports = router; 