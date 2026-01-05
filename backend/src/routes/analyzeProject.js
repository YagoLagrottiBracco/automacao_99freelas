/**
 * Route - Analyze Project
 * 
 * Endpoint para análise de projetos e geração de propostas
 */

const express = require('express');
const router = express.Router();

const rulesEngine = require('../services/rules.engine');
const promptBuilder = require('../services/prompt.builder');
const openaiService = require('../services/openai.service');

/**
 * POST /api/analyze
 * 
 * Recebe dados do projeto e retorna proposta estruturada
 */
router.post('/analyze', async (req, res, next) => {
    try {
        const projectData = req.body;

        // Validação básica
        if (!projectData || !projectData.tituloProjeto) {
            return res.status(400).json({
                error: 'Dados do projeto inválidos. O título é obrigatório.'
            });
        }

        console.log('\n📋 Analisando projeto:', projectData.tituloProjeto);

        // 1. Aplica regras de negócio
        const rulesResult = rulesEngine.analyze(projectData);
        console.log('📊 Resultado das regras:', JSON.stringify(rulesResult, null, 2));

        // 2. Verifica viabilidade antes de chamar a IA
        if (rulesResult.viabilidade === 'inviável') {
            console.log('⚠️ Projeto inviável - pulando chamada à IA');
            return res.json({
                textoProposta: 'este projeto você pula.',
                prazo: 0,
                valor: 0,
                complexidade: rulesResult.complexidade,
                viabilidade: 'inviável'
            });
        }

        // 3. Constrói o prompt
        const prompt = promptBuilder.build(projectData, rulesResult);
        console.log('📝 Prompt construído');

        // 4. Chama a OpenAI
        const aiResponse = await openaiService.generateProposal(prompt);
        console.log('🤖 Resposta da IA recebida');

        // 5. Monta resposta final
        const response = {
            textoProposta: aiResponse.textoProposta,
            prazo: aiResponse.prazo || rulesResult.prazoSugerido,
            valor: aiResponse.valor || rulesResult.valorSugerido,
            complexidade: rulesResult.complexidade,
            viabilidade: rulesResult.viabilidade
        };

        console.log('✅ Análise concluída com sucesso');
        res.json(response);

    } catch (error) {
        console.error('❌ Erro na análise:', error);
        next(error);
    }
});

/**
 * GET /api/analyze/test
 * 
 * Endpoint de teste simples
 */
router.get('/analyze/test', (req, res) => {
    res.json({
        message: 'Endpoint de análise funcionando!',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
