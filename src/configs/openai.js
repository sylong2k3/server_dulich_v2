const OpenAI = require('openai');

class MissingOpenAIKeyError extends Error {
    constructor(message = 'OPENAI_API_KEY chưa được cấu hình trong .env') {
        super(message);
        this.name = 'MissingOpenAIKeyError';
        this.code = 'OPENAI_KEY_MISSING';
    }
}

let _client = null;

function getOpenAIClient() {
    if (!_client) {
        if (!process.env.OPENAI_API_KEY) {
            throw new MissingOpenAIKeyError();
        }
        _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _client;
}

module.exports = { getOpenAIClient, MissingOpenAIKeyError };
