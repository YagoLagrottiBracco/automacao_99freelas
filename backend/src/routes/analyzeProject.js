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
const accessService = require('../services/access.service');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * POST /api/analyze
 * 
 * Recebe dados do projeto e retorna proposta estruturada
 */
router.post('/analyze', authMiddleware, async (req, res, next) => {
    try {
        const { userConfig, ...projectData } = req.body;
        const userId = req.user.id; // Vem do authMiddleware

        // 0. Verifica Acesso (Trial / Assinatura)
        const accessParams = await accessService.checkAccess(userId);

        if (!accessParams.allowed) {
            return res.status(403).json({
                error: 'Limite de avaliações gratuitas excedido.',
                code: 'LIMIT_REACHED',
                limit: accessParams.limit,
                upgradeUrl: 'https://sua-url-de-upgrade.com' // Pode ser configurado
            });
        }

        // Validação básica
        if (!projectData || !projectData.tituloProjeto) {
            return res.status(400).json({
                error: 'Dados do projeto inválidos. O título é obrigatório.'
            });
        }

        console.log('\n📋 Analisando projeto:', projectData.tituloProjeto);
        if (userConfig) {
            console.log('⚙️ Usando configurações personalizadas do usuário');
        }

        // 1. Aplica regras de negócio (com config do usuário)
        const rulesResult = rulesEngine.analyze(projectData, userConfig);
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

        // 3. Constrói o prompt (com config do usuário)
        const prompt = promptBuilder.build(projectData, rulesResult, userConfig);
        console.log('📝 Prompt construído');

        // 4. Chama a OpenAI
        const aiResponse = await openaiService.generateProposal(prompt);
        console.log('🤖 Resposta da IA recebida');

        // 5. Monta resposta final (com template do usuário)
        // Se houver template personalizado, usamos o assemble da nova versão
        // Caso contrário, a IA retorna o textoExplicacao e só isso basta para o frontend antigo
        // MAS: O frontend espera 'textoProposta' completo.

        const finalProposalText = promptBuilder.assembleProposal(
            projectData.nomeCliente,
            aiResponse.textoExplicacao || aiResponse.textoProposta, // Tenta usar o bruto, fallback para o montado
            projectData,
            rulesResult,
            userConfig?.proposalTemplate,
            aiResponse.duvidaPertinente
        );

        const response = {
            textoProposta: finalProposalText,
            prazo: aiResponse.prazo || rulesResult.prazoSugerido,
            valor: aiResponse.valor || rulesResult.valorSugerido,
            complexidade: rulesResult.complexidade,
            viabilidade: rulesResult.viabilidade
        };

        console.log('✅ Análise concluída com sucesso');

        // Registra o uso (desconta do trial)
        await accessService.logUsage(userId, projectData.tituloProjeto);

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
