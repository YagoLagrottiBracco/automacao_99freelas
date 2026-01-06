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

// Mapeamento de papéis e suas configurações padrão
const ROLE_CONFIGS = {
    'developer': { labels: 'Tecnologias', defaultStack: 'React + Node.js' },
    'copywriter': { labels: 'Habilidades de Escrita', defaultStack: 'SEO + Copywriting' },
    'designer': { labels: 'Ferramentas de Design', defaultStack: 'Figma + Adobe Suite' },
    'translator': { labels: 'Idiomas', defaultStack: 'Tradução Profissional' },
    'marketing': { labels: 'Skills de Marketing', defaultStack: 'Gestão de Tráfego + Growth' },
    'other': { labels: 'Habilidades', defaultStack: 'Minhas Habilidades' }
};
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
    const stackRecommendation = getStackRecommendation(stackMencionada, descricaoProjeto, config);

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

    // Ajusta complexidade baseada na stack desconhecida
    if (knowledgeLevel === 'básico' && classification.complexity === 'complexo') {
        // Se a complexidade for alta e o conhecimento básico, alerta na viabilidade
        // Mas a função assessViability já cuida disso parcialmente.
    }

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
 * Obtém recomendação de stack/habilidade
 * @param {string} stackMencionada - Stack identificada no projeto
 * @param {string} descricao - Descrição do projeto
 * @param {Object} config - Configurações do usuário
 * @returns {Object} - Recomendação de stack
 */
function getStackRecommendation(stackMencionada, descricao, config = {}) {
    const stack = (stackMencionada || '').toLowerCase();
    const desc = (descricao || '').toLowerCase();
    const whitelist = config.whitelist || [];
    const userRole = config.userRole || 'developer';
    const roleConfig = ROLE_CONFIGS[userRole] || ROLE_CONFIGS['other'];

    // 0. Verifica Whitelist (Prioridade Máxima)
    if (whitelist && whitelist.length > 0) {
        // Ordena por tamanho da string para pegar a "stack" mais específica primeiro
        const sortedWhitelist = [...whitelist].sort((a, b) => b.length - a.length);

        for (const tech of sortedWhitelist) {
            if (stack.includes(tech.toLowerCase()) || desc.includes(tech.toLowerCase())) {
                return {
                    stack: tech, // Usa a grafia definida pelo usuário
                    suggestion: `Como você domina ${tech}, esta é uma excelente oportunidade.`
                };
            }
        }
    }

    // Lógica Específica para Desenvolvedores (Hardcoded Legacy Support)
    if (userRole === 'developer') {
        // WordPress
        if (stack.includes('wordpress') || desc.includes('wordpress')) {
            return {
                stack: 'WordPress',
                suggestion: 'Você pode oferecer desenvolvimento visual e plugins de SEO.'
            };
        }

        // PHP sem Laravel
        if (stack.includes('php') && !stack.includes('laravel')) {
            return {
                stack: 'PHP ou JavaScript',
                suggestion: 'O projeto requer PHP. Avalie se vale a pena sugerir migração para JS.'
            };
        }
    }

    // Se não encontrou na whitelist e nem nas regras específicas

    // Se a stack foi identificada no texto, usamos ela
    if (stack && stack !== 'não identificada' && stack !== 'não informado') {
        return {
            stack: stackMencionada,
            suggestion: `O projeto menciona ${stackMencionada}. Avalie se você atende aos requisitos.`
        };
    }

    // Fallback genérico baseado no papel
    return {
        stack: roleConfig.defaultStack,
        suggestion: `Não identificamos tecnologias específicas. Sugira sua stack padrão: ${roleConfig.defaultStack}.`
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

    // Tecnologias desconhecidas (não estão na whitelist)
    // Se o usuário não tem a skill na whitelist e o projeto pede algo complexo, reduz viabilidade
    // Simplificação: Se whitelist não está vazia e stack não está nela => Baixo match
    /*
    const hasMatch = whitelist.some(tech => stackLower.includes(tech.toLowerCase()) || desc.includes(tech.toLowerCase()));
    if (whitelist.length > 0 && !hasMatch && classification.complexity !== 'simples') {
        return 'viável com ressalvas (stack não listada)';
    }
    */

    return 'viável';
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

    return 'básico'; // Se não está na whitelist, assume básico para ser conservador
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
