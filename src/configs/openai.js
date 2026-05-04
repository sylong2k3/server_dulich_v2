const OpenAI = require('openai');

let _client = null;

function getOpenAIClient() {
    if (!_client) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY chưa được cấu hình trong .env');
        }
        _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _client;
}

module.exports = { getOpenAIClient };
