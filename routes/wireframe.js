const express = require('express');
const router = express.Router();
const axios = require('axios');

// Configuration for Python API
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5000';

/**
 * @route   POST /api/wireframe/generate
 * @desc    Generate wireframe HTML from prompt
 * @access  Private
 */
router.post('/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ 
                success: false, 
                message: 'Prompt is required' 
            });
        }

        // Call Python API
        const response = await axios.post(`${PYTHON_API_URL}/generate`, {
            prompt
        });

        // Return the generated wireframe
        res.json({
            success: true,
            data: response.data
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