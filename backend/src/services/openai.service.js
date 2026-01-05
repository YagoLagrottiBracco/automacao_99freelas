/**
 * OpenAI Service - Integração com API da OpenAI
 * 
 * Gerencia chamadas à API para geração de propostas
 */

const OpenAI = require('openai');
const promptBuilder = require('./prompt.builder');

// Inicializa cliente OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Modelo a ser usado
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * Gera uma proposta usando GPT
 * @param {Object} prompt - Objeto com system e user prompts
 * @returns {Object} - Resposta estruturada
 */
async function generateProposal(prompt) {
    try {
        // Valida chave da API
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-api-key-here') {
            throw new Error('Chave da API OpenAI não configurada. Edite o arquivo .env');
        }

        console.log(`🤖 Chamando OpenAI (modelo: ${MODEL})...`);

        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: prompt.system },
                { role: 'user', content: prompt.user }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
        });

        // Extrai conteúdo da resposta
        const content = response.choices[0]?.message?.content;

        if (!content) {
            throw new Error('Resposta vazia da OpenAI');
        }

        // Parse do JSON
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (parseError) {
            console.error('Erro ao fazer parse da resposta:', content);
            throw new Error('Resposta da OpenAI não é um JSON válido');
        }

        // Extrai dados do cliente do prompt para montar proposta
        const nomeClienteMatch = prompt.user.match(/Cliente: (.+)/);
        const nomeCliente = nomeClienteMatch ? nomeClienteMatch[1] : 'Cliente';

        // Monta proposta completa
        const textoProposta = promptBuilder.assembleProposal(
            nomeCliente,
            parsed.textoExplicacao || parsed.textExplanation || ''
        );

        return {
            textoProposta, // Legado / Fallback
            textoExplicacao: parsed.textoExplicacao || parsed.textExplanation || '',
            duvidaPertinente: parsed.duvidaPertinente || '',
            prazo: parsed.prazo || parsed.deadline || null,
            valor: parsed.valor || parsed.value || null
        };

    } catch (error) {
        // Trata erros específicos da OpenAI
        if (error.code === 'invalid_api_key') {
            throw new Error('Chave da API OpenAI inválida');
        }

        if (error.code === 'insufficient_quota') {
            throw new Error('Limite de créditos da OpenAI excedido');
        }

        if (error.code === 'rate_limit_exceeded') {
            throw new Error('Limite de requisições excedido. Tente novamente em alguns segundos.');
        }

        console.error('Erro na chamada à OpenAI:', error.message);
        throw error;
    }
}

/**
 * Testa a conexão com a API
 * @returns {boolean} - True se a conexão está ok
 */
async function testConnection() {
    try {
        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: 'Responda apenas: OK' }],
            max_tokens: 5
        });

        return !!response.choices[0]?.message?.content;
    } catch (error) {
        console.error('Erro ao testar conexão:', error.message);
        return false;
    }
}

module.exports = {
    generateProposal,
    testConnection
};
