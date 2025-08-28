const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function enhanceHtmlWithGPT(html, prompt, primaryColor) {
  try {
    if (!prompt || !primaryColor) {
      console.error('Missing required parameters for enhanceHtmlWithGPT');
      return html;
    }

    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'undefined') {
      console.error('OPENAI_API_KEY is not configured. Please set the environment variable.');
      // Return a basic wireframe as fallback
      return generateFallbackWireframe(prompt, primaryColor);
    }

    // Determine if this is a direct generation or enhancement
    const isDirectGeneration = html === '<div class="wireframe-container"></div>';

    const gptPrompt = isDirectGeneration
      ? `You are a UI wireframe generator. Create a complete HTML/CSS wireframe based on this description: "${prompt}". Use the primary color ${primaryColor} for key elements. The wireframe should be responsive and follow modern design principles. Return ONLY the complete HTML/CSS code.`
      : `You are a UI wireframe assistant. ONLY return HTML/CSS for a wireframe in black, white, and gray (no other colors). Do not use any color except black, white, or gray for backgrounds, borders, or text. The image should be visually simple and minimal, with no color. Input HTML: ${html} User's original request: "${prompt}" Generate a small, minimal, black-and-white wireframe.`;

    console.log('Making OpenAI API request with prompt:', gptPrompt.substring(0, 100) + '...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a UI enhancement assistant that ONLY returns HTML/CSS code with no additional text or explanations.' },
          { role: 'user', content: gptPrompt }
        ],
        max_tokens: 2000, // Increased for direct generation
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid response from OpenAI API:', data);
      return generateFallbackWireframe(prompt, primaryColor);
    }

    let enhancedHtml = data.choices[0].message.content;
    enhancedHtml = enhancedHtml.trim();
    enhancedHtml = enhancedHtml.replace(/```html\n?/gi, '')
                              .replace(/```\n?/gi, '')
                              .replace(/```css\n?/gi, '');

    console.log('Successfully generated wireframe HTML');
    return enhancedHtml;
  } catch (error) {
    console.error('Error in enhanceHtmlWithGPT:', error);
    return generateFallbackWireframe(prompt, primaryColor);
  }
}

// Fallback wireframe generator when OpenAI is not available
function generateFallbackWireframe(prompt, primaryColor) {
  console.log('Generating fallback wireframe for:', prompt);
  
  // Extract key elements from the prompt
  const lowerPrompt = prompt.toLowerCase();
  let wireframeHtml = `<div class="wireframe-container" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">`;
  
  if (lowerPrompt.includes('login') || lowerPrompt.includes('sign in')) {
    wireframeHtml += `
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="text-align: center; color: #333; margin-bottom: 30px;">Login</h2>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; color: #666;">Email</label>
          <input type="email" placeholder="Enter your email" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; color: #666;">Password</label>
          <input type="password" placeholder="Enter your password" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
        </div>
        <button style="width: 100%; padding: 12px; background: ${primaryColor}; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer;">Sign In</button>
        <div style="text-align: center; margin-top: 20px;">
          <a href="#" style="color: ${primaryColor}; text-decoration: none;">Forgot Password?</a>
        </div>
      </div>
    `;
  } else if (lowerPrompt.includes('contact') || lowerPrompt.includes('form')) {
    wireframeHtml += `
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="text-align: center; color: #333; margin-bottom: 30px;">Contact Us</h2>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; color: #666;">Name</label>
          <input type="text" placeholder="Your name" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; color: #666;">Email</label>
          <input type="email" placeholder="Your email" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; color: #666;">Message</label>
          <textarea placeholder="Your message" rows="4" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; resize: vertical;"></textarea>
        </div>
        <button style="width: 100%; padding: 12px; background: ${primaryColor}; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer;">Send Message</button>
      </div>
    `;
  } else if (lowerPrompt.includes('dashboard')) {
    wireframeHtml += `
      <div style="background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background: ${primaryColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">Dashboard</h2>
        </div>
        <div style="padding: 20px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Stats</h3>
              <p style="margin: 0; color: #666;">View your analytics</p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Recent</h3>
              <p style="margin: 0; color: #666;">Latest activities</p>
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Quick Actions</h3>
            <button style="padding: 8px 16px; background: ${primaryColor}; color: white; border: none; border-radius: 4px; margin-right: 10px;">New Project</button>
            <button style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px;">View Reports</button>
          </div>
        </div>
      </div>
    `;
  } else {
    // Generic wireframe
    wireframeHtml += `
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="text-align: center; color: #333; margin-bottom: 30px;">Wireframe</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
          <p style="margin: 0; color: #666; text-align: center;">Content area for: ${prompt}</p>
        </div>
        <div style="text-align: center;">
          <button style="padding: 12px 24px; background: ${primaryColor}; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer;">Action Button</button>
        </div>
      </div>
    `;
  }
  
  wireframeHtml += `</div>`;
  return wireframeHtml;
}

module.exports = { enhanceHtmlWithGPT }; 
