import OpenAI from 'openai';

// We initialize this lazily or with a dummy key to prevent the app from crashing on load if the key is missing.
const getOpenRouterClient = () => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    dangerouslyAllowBrowser: true // Since we are running in Vite client for demo purposes
  });
};

export const parseConventionWithAI = async (text: string) => {
  const openai = getOpenRouterClient();
  
  if (!openai) {
    throw new Error('OpenRouter API key is not configured. Please add VITE_OPENROUTER_API_KEY to your .env file.');
  }

  const prompt = `
You are an assistant that extracts tattoo convention information from text.
Extract the following fields from the text provided and return ONLY a valid JSON object without any markdown wrapping (no \`\`\`json):
- name: string (The name of the convention)
- start_date: string (YYYY-MM-DD format. IMPORTANT: Ensure it is a valid date string. If the text only provides a month and day, assume the current year or the most logical upcoming year)
- end_date: string (YYYY-MM-DD format. IMPORTANT: Ensure it is a valid date string. If the text only provides a month and day, assume the current year or the most logical upcoming year)
- location: string (City, Country)
- venue: string (The specific building/venue name, if any)

If you cannot find a specific field, leave it empty or make your best guess.

Text:
${text}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'inclusionai/ring-2.6-1t:free',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 1024,
    });

    const responseText = response.choices[0].message.content || '';
    
    // Clean up potential markdown formatting that might still be returned
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    if (cleanedText) {
      return JSON.parse(cleanedText);
    }
    return null;
  } catch (error) {
    console.error('Error parsing with AI:', error);
    throw error;
  }
};

export const parseConventionWithAIVision = async (base64Image: string) => {
  const openai = getOpenRouterClient();
  
  if (!openai) {
    throw new Error('OpenRouter API key is not configured.');
  }

  const prompt = `
You are an assistant that extracts tattoo convention information from an image.
Extract the following fields from the image provided and return ONLY a valid JSON object without any markdown wrapping (no \`\`\`json):
- name: string (The name of the convention)
- start_date: string (YYYY-MM-DD format. IMPORTANT: Ensure it is a valid date string. If the image only provides a month and day, assume the current year or the most logical upcoming year)
- end_date: string (YYYY-MM-DD format. IMPORTANT: Ensure it is a valid date string. If the image only provides a month and day, assume the current year or the most logical upcoming year)
- location: string (City, Country)
- venue: string (The specific building/venue name, if any)

If you cannot find a specific field, leave it empty or make your best guess.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: base64Image } }
          ]
        }
      ],
      temperature: 0,
      max_tokens: 1024,
    });

    const responseText = response.choices[0].message.content || '';
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    if (cleanedText) {
      return JSON.parse(cleanedText);
    }
    return null;
  } catch (error) {
    console.error('Error parsing convention with AI Vision:', error);
    throw error;
  }
};

export const parseAccommodationTextWithAI = async (text: string) => {
  const openai = getOpenRouterClient();
  
  if (!openai) {
    throw new Error('OpenRouter API key is not configured. Please add VITE_OPENROUTER_API_KEY to your .env file.');
  }

  const prompt = `
You are an assistant that extracts hotel/accommodation information from text.
Extract the following fields from the text provided and return ONLY a valid JSON object without any markdown wrapping (no \`\`\`json):
- hotel_name: string
- hotel_address: string
- check_in_date: string (YYYY-MM-DD format. IMPORTANT: Ensure it is a valid date string. If the text only provides a month and day, assume the current year or the most logical upcoming year)
- check_out_date: string (YYYY-MM-DD format. IMPORTANT: Ensure it is a valid date string. If the text only provides a month and day, assume the current year or the most logical upcoming year)
- room_number: string
- contact_phone: string
- access_code: string (door code, PIN, password, etc.)

If you cannot find a specific field, leave it empty or make your best guess.

Text:
${text}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'inclusionai/ring-2.6-1t:free',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 1024,
    });

    const responseText = response.choices[0].message.content || '';
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    if (cleanedText) {
      return JSON.parse(cleanedText);
    }
    return null;
  } catch (error) {
    console.error('Error parsing accommodation with AI:', error);
    throw error;
  }
};

export const parseAccommodationWithAI = async (base64Image: string) => {
  const openai = getOpenRouterClient();
  
  if (!openai) {
    throw new Error('OpenRouter API key is not configured. Please add VITE_OPENROUTER_API_KEY to your .env file.');
  }

  const prompt = `
You are an assistant that extracts hotel/accommodation information from a screenshot.
Extract the following fields from the image and return ONLY a valid JSON object without any markdown wrapping (no \`\`\`json):
- hotel_name: string
- hotel_address: string
- check_in_date: string (YYYY-MM-DD format)
- check_out_date: string (YYYY-MM-DD format)
- room_number: string
- contact_phone: string
- access_code: string (door code, PIN, password, etc.)

If you cannot find a specific field, leave it empty.
`;

  try {
    // We use gemini-2.5-flash through OpenRouter for vision tasks.
    // The previous model inclusionai/ring-2.6-1t:free apparently does not support image_url input via OpenRouter endpoints.
    const response = await openai.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: base64Image } }
          ]
        }
      ],
      temperature: 0,
      max_tokens: 1024,
    });

    const responseText = response.choices[0].message.content || '';
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    if (cleanedText) {
      return JSON.parse(cleanedText);
    }
    return null;
  } catch (error) {
    console.error('Error parsing image with AI:', error);
    throw error;
  }
};
