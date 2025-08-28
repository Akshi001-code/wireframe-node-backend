# Backend Setup Guide

## Environment Variables Required

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/wireframe-ai

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Server Configuration
PORT=5001
NODE_ENV=development

# Firebase Configuration (if using Firebase)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
```

## Getting OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file

## Running the Backend

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables in `.env` file

3. Start the server:
   ```bash
   npm start
   ```

## Troubleshooting UI Generation

If the UI generation is not working:

1. **Check OpenAI API Key**: Ensure `OPENAI_API_KEY` is set correctly
2. **Check API Response**: The system now includes fallback wireframes when OpenAI is unavailable
3. **Check Logs**: Look for error messages in the console output

## Fallback Wireframe System

The system now includes a fallback wireframe generator that creates basic wireframes when:
- OpenAI API key is not configured
- OpenAI API is unavailable
- API calls fail

This ensures the UI generation always works, even without OpenAI integration.
