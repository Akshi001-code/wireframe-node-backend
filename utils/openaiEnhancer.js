const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function enhanceHtmlWithGPT(html, prompt, primaryColor) {
  try {
    if (!html || !prompt || !primaryColor) {
      console.error('Missing required parameters for enhanceHtmlWithGPT');
      return html;
    }

    const gptPrompt = `You are a UI wireframe assistant. ONLY return HTML/CSS for a wireframe in black, white, and gray (no other colors). Do not use any color except black, white, or gray for backgrounds, borders, or text. The image should be visually simple and minimal, with no color. Input HTML: ${html} User's original request: "${prompt}" Generate a small, minimal, black-and-white wireframe.`;

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
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid response from OpenAI API');
      return html;
    }

    let enhancedHtml = data.choices[0].message.content;
    enhancedHtml = enhancedHtml.trim();
    enhancedHtml = enhancedHtml.replace(/```html\n?/gi, '')
                              .replace(/```\n?/gi, '')
                              .replace(/```css\n?/gi, '');
    const htmlStart = enhancedHtml.indexOf('<');
    const htmlEnd = enhancedHtml.lastIndexOf('>') + 1;
    if (htmlStart !== -1 && htmlEnd !== -1) {
      enhancedHtml = enhancedHtml.substring(htmlStart, htmlEnd);
    }
    return enhancedHtml || html;
  } catch (error) {
    console.error('Error in enhanceHtmlWithGPT:', error);
    return html;
  }
}

module.exports = { enhanceHtmlWithGPT }; 
