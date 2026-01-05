/**
 * Rules Engine - Motor de Regras de Negócio
 * 
 * Implementa todas as regras de negócio para análise de projetos:
 * - Classificação de complexidade
 * - Cálculo de prazo
 * - Cálculo de valor
 * - Determinação de viabilidade
 * - Recomendações de stack
 */

const classifier = require('../utils/classifier');

/**
 * Conhecimento técnico do freelancer
 */
const TECHNICAL_KNOWLEDGE = {
    'PHP': 'alto',
    'Laravel': 'alto',
    'WordPress': 'médio',
    'Elementor': 'médio',
    'JavaScript': 'avançado',
    'Node.js': 'avançado',
    'React': 'avançado',
    'Vue': 'avançado',
    'Next.js': 'avançado',
    'HTML': 'avançado',
    'CSS': 'avançado',
    'Python': 'básico',
    'Java': 'básico',
    '.NET': 'básico',
    'Ruby': 'básico',
    'Mobile': 'básico'
};

/**
 * Fatores de ajuste de prazo por stack
 */
const DEADLINE_FACTORS = {
    'JavaScript': 1.5,  // +50%
    'Node.js': 1.5,
    'React': 1.5,
    'Vue': 1.5,
    'Next.js': 1.5,
    'PHP': 1.25,        // +25%
    'Laravel': 1.25,
    'WordPress': 1.0,
    'default': 1.15     // +15% base
};

/**
 * Fatores de ajuste de prazo por complexidade
 */
const COMPLEXITY_DEADLINE_FACTORS = {
    'simples': 1.0,
    'médio': 1.2,
    'complexo': 1.4,
    'arriscado': 1.5
};

/**
 * Fatores de desconto de valor por complexidade
 */
const VALUE_DISCOUNT_FACTORS = {
    'simples': 0.10,    // -10%
    'médio': 0.10,      // max -10%
    'complexo': 0.05,   // max -5%
    'arriscado': 0.0    // sem desconto
};

/**
 * Analisa o projeto e retorna recomendações
 * @param {Object} projectData - Dados do projeto
 * @param {Object} userConfig - Configurações do usuário (whitelist, blacklist, ajustes)
 * @returns {Object} - Resultado da análise
 */
function analyze(projectData, userConfig = {}) {
    const {
        descricaoProjeto = '',
        stackMencionada = '',
        orcamentoInformado,
        prazoInformado
    } = projectData;

    // Default config fallback
    const config = {
        whitelist: [],
        blacklist: [],
        valueAdjustment: 0,
        deadlineAdjustment: 0,
        ...userConfig
    };

    // 1. Classifica o projeto
    const classification = classifier.classify(descricaoProjeto, stackMencionada);

    // 2. Determina a stack recomendada (Considerando whitelist)
    const stackRecommendation = getStackRecommendation(stackMencionada, descricaoProjeto, config.whitelist);

    // 3. Avalia viabilidade (Considerando blacklist)
    const viability = assessViability(classification, stackMencionada, descricaoProjeto, config.blacklist);

    // 4. Calcula prazo sugerido (Com ajuste percentual)
    const prazoSugerido = calculateDeadline(
        prazoInformado,
        classification.complexity,
        stackMencionada,
        config.deadlineAdjustment
    );

    // 5. Calcula valor sugerido (Com ajuste percentual)
    const valorSugerido = calculateValue(
        orcamentoInformado,
        classification.complexity,
        config.valueAdjustment
    );

    // 6. Determina nível de conhecimento
    const knowledgeLevel = getKnowledgeLevel(stackMencionada, config.whitelist);

    return {
        complexidade: classification.complexity,
        viabilidade: viability,
        prazoSugerido,
        valorSugerido,
        stackRecomendada: stackRecommendation.stack,
        sugestaoStack: stackRecommendation.suggestion,
        nivelConhecimento: knowledgeLevel,
        motivos: classification.reasons
    };
}

/**
 * Obtém recomendação de stack
 * @param {string} stackMencionada - Stack identificada
 * @param {string} descricao - Descrição do projeto
 * @param {string[]} whitelist - Tags prioritárias do usuário
 * @returns {Object} - Recomendação de stack
 */
function getStackRecommendation(stackMencionada, descricao, whitelist = []) {
    const stack = stackMencionada.toLowerCase();
    const desc = descricao.toLowerCase();

    // 0. Verifica Whitelist - Se o projeto menciona algo da whitelist, reforça o uso
    if (whitelist && whitelist.length > 0) {
        for (const tech of whitelist) {
            if (stack.includes(tech.toLowerCase()) || desc.includes(tech.toLowerCase())) {
                return {
                    stack: tech, // Usa a grafia da whitelist do usuário
                    suggestion: `Como você domina ${tech}, esta é uma excelente oportunidade para aplicar seu conhecimento.`
                };
            }
        }
    }

    // WordPress → Elementor Pro + Yoast Pro
    if (stack.includes('wordpress') || desc.includes('wordpress')) {
        return {
            stack: 'WordPress',
            suggestion: 'Utilizarei Elementor Pro para o desenvolvimento visual e Yoast Pro para SEO, ambos sem custo adicional para você.'
        };
    }

    // Sem stack definida → React + Node
    if (stack === 'não identificada' || !stack) {
        return {
            stack: 'React + Node.js',
            suggestion: 'Como não há uma tecnologia específica definida, sugiro desenvolver com React no frontend e Node.js no backend, que são tecnologias modernas e performáticas.'
        };
    }

    // PHP → Perguntar sobre migração
    if (stack.includes('php') && !stack.includes('laravel')) {
        return {
            stack: 'PHP ou JavaScript',
            suggestion: 'O projeto menciona PHP. Posso desenvolver nessa tecnologia, mas também tenho a opção de migrar para JavaScript (React + Node) caso prefira uma stack mais moderna. O que acha?'
        };
    }

    // JS sem React/Node → Respeitar
    if (stack.includes('javascript') || stack.includes('vue') || stack.includes('angular')) {
        return {
            stack: stackMencionada,
            suggestion: 'Desenvolverei utilizando a stack mencionada no projeto.'
        };
    }

    // Default
    return {
        stack: stackMencionada,
        suggestion: null
    };
}

/**
 * Avalia a viabilidade do projeto
 * @param {Object} classification - Classificação do projeto
 * @param {string} stack - Stack mencionada
 * @param {string} descricao - Descrição do projeto
 * @param {string[]} blacklist - Lista de tecnologias bloqueadas pelo usuário
 * @returns {string} - Viabilidade
 */
function assessViability(classification, stack, descricao, blacklist = []) {
    const desc = descricao.toLowerCase();
    const stackLower = stack.toLowerCase();

    // 1. Verifica tecnologias na BLACKLIST
    if (blacklist && blacklist.length > 0) {
        for (const blockedTech of blacklist) {
            if (stackLower.includes(blockedTech.toLowerCase()) || desc.includes(blockedTech.toLowerCase())) {
                return 'inviável (blacklist: ' + blockedTech + ')';
            }
        }
    }

    // Palavras-chave de projetos inviáveis
    const inviableKeywords = [
        'ilegal', 'fraude', 'hack', 'crack', 'piratear',
        'automatizar login', 'burlar', 'captcha', 'bot automatico',
        'raspar dados pessoais', 'spam', 'phishing'
    ];

    for (const keyword of inviableKeywords) {
        if (desc.includes(keyword)) {
            return 'inviável';
        }
    }

    // Tecnologias com conhecimento básico e complexidade alta
    const basicKnowledgeStacks = ['python', 'java', '.net', 'ruby', 'mobile', 'flutter', 'swift', 'kotlin'];
    const hasBasicStack = basicKnowledgeStacks.some(s => stackLower.includes(s));

    if (hasBasicStack && (classification.complexity === 'complexo' || classification.complexity === 'arriscado')) {
        return 'baixa viabilidade';
    }

    // Projeto arriscado
    if (classification.complexity === 'arriscado') {
        return 'arriscado - avaliar com cautela';
    }

    // Projeto com complexidade alta em stack com conhecimento básico
    if (hasBasicStack) {
        return 'viável com ressalvas';
    }

    return 'viável';
}

/**
 * Calcula prazo sugerido
 * @param {number|null} prazoInformado - Prazo informado pelo cliente
 * @param {string} complexidade - Complexidade do projeto
 * @param {string} stack - Stack mencionada
 * @param {number} adjustmentPercent - Ajuste manual em % (ex: 20 para +20%)
 * @returns {number} - Prazo em dias
 */
function calculateDeadline(prazoInformado, complexidade, stack, adjustmentPercent = 0) {
    // Prazo base (se não informado, estima baseado na complexidade)
    let prazoBase = prazoInformado;

    if (!prazoBase) {
        const basePorComplexidade = {
            'simples': 7,
            'médio': 15,
            'complexo': 30,
            'arriscado': 45
        };
        prazoBase = basePorComplexidade[complexidade] || 15;
    }

    // Fator de ajuste base (+10% a +20%)
    const baseAdjustment = 1.15; // +15% em média

    // Fator de ajuste por stack
    let stackFactor = DEADLINE_FACTORS['default'];
    const stackLower = stack.toLowerCase();

    for (const [key, factor] of Object.entries(DEADLINE_FACTORS)) {
        if (stackLower.includes(key.toLowerCase())) {
            stackFactor = factor;
            break;
        }
    }

    // Fator de ajuste por complexidade
    const complexityFactor = COMPLEXITY_DEADLINE_FACTORS[complexidade] || 1.0;

    // Fator de ajuste manual do usuário
    const userFactor = 1 + (adjustmentPercent / 100);

    // Calcula prazo final
    const prazoFinal = Math.ceil(prazoBase * baseAdjustment * stackFactor * complexityFactor * userFactor);

    return prazoFinal;
}

/**
 * Calcula valor sugerido
 * @param {number|null} orcamentoInformado - Orçamento informado pelo cliente
 * @param {string} complexidade - Complexidade do projeto
 * @param {number} adjustmentPercent - Ajuste manual em %
 * @returns {number} - Valor sugerido
 */
function calculateValue(orcamentoInformado, complexidade, adjustmentPercent = 0) {
    // Se não há orçamento informado, não podemos calcular
    if (!orcamentoInformado) {
        return null;
    }

    // Fator de desconto baseado na complexidade
    const discountFactor = VALUE_DISCOUNT_FACTORS[complexidade] || 0.05;

    // Aplica desconto base de -5% a -10% (usando média de -7.5%)
    const baseDiscount = 0.075;

    // Desconto final é o mínimo entre base e máximo permitido pela complexidade
    const finalDiscount = Math.min(baseDiscount, discountFactor);

    // Valor base com desconto
    let valorBase = orcamentoInformado * (1 - finalDiscount);

    // Aplica ajuste manual do usuário (pode aumentar ou diminuir)
    if (adjustmentPercent !== 0) {
        valorBase = valorBase * (1 + (adjustmentPercent / 100));
    }

    // Calcula valor final arredondado
    const valorFinal = Math.round(valorBase);

    return valorFinal;
}

/**
 * Obtém nível de conhecimento para a stack
 * @param {string} stack - Stack mencionada
 * @param {string[]} whitelist - Tags prioritárias
 * @returns {string} - Nível de conhecimento
 */
function getKnowledgeLevel(stack, whitelist = []) {
    const stackLower = stack.toLowerCase();

    // Se estiver na whitelist, é expert
    if (whitelist && whitelist.length > 0) {
        if (whitelist.some(tech => stackLower.includes(tech.toLowerCase()))) {
            return 'especialista';
        }
    }

    for (const [key, level] of Object.entries(TECHNICAL_KNOWLEDGE)) {
        if (stackLower.includes(key.toLowerCase())) {
            return level;
        }
    }

    return 'médio'; // Default
}

module.exports = {
    analyze,
    getStackRecommendation,
    assessViability,
    calculateDeadline,
    calculateValue,
    getKnowledgeLevel,
    TECHNICAL_KNOWLEDGE
};
