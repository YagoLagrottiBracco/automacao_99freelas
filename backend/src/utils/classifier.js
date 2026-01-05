/**
 * Classifier - Classificador de Projetos
 * 
 * Utility para classificação de complexidade e detecção de características
 */

/**
 * Palavras-chave para classificação de complexidade
 */
const COMPLEXITY_KEYWORDS = {
    simples: [
        'landing page', 'página simples', 'site institucional',
        'one page', 'hotsite', 'ajuste', 'correção pequena',
        'alteração simples', 'bug simples', 'página única',
        'html estático', 'formulário simples'
    ],
    médio: [
        'blog', 'e-commerce simples', 'loja virtual simples',
        'sistema de cadastro', 'crud', 'dashboard simples',
        'integração api', 'migração', 'responsivo',
        'multi-página', 'várias páginas'
    ],
    complexo: [
        'sistema completo', 'app web', 'aplicação web',
        'e-commerce completo', 'marketplace', 'erp',
        'crm', 'painel administrativo', 'multi-usuário',
        'autenticação', 'integração múltipla', 'api rest',
        'tempo real', 'websocket', 'pagamento'
    ],
    arriscado: [
        'prazo apertado', 'urgente', 'para ontem',
        'não sei explicar', 'complexo e barato',
        'refatoração grande', 'sistema legado',
        'sem documentação', 'integração legada',
        'cliente difícil', 'já passou por outros devs'
    ]
};

/**
 * Palavras-chave de stacks
 */
const STACK_KEYWORDS = {
    'WordPress': ['wordpress', 'woocommerce', 'elementor', 'wp', 'tema wp', 'plugin wp'],
    'React': ['react', 'reactjs', 'react.js', 'next.js', 'nextjs', 'gatsby'],
    'Vue': ['vue', 'vuejs', 'vue.js', 'nuxt', 'nuxtjs'],
    'Angular': ['angular', 'angularjs'],
    'Node.js': ['node', 'nodejs', 'node.js', 'express', 'nestjs', 'fastify'],
    'PHP': ['php', 'laravel', 'symfony', 'codeigniter', 'yii', 'cakephp'],
    'Python': ['python', 'django', 'flask', 'fastapi'],
    'Java': ['java', 'spring', 'springboot', 'spring boot'],
    '.NET': ['.net', 'dotnet', 'c#', 'csharp', 'asp.net', 'blazor'],
    'Ruby': ['ruby', 'rails', 'ruby on rails'],
    'Mobile': ['react native', 'flutter', 'ionic', 'android', 'ios', 'swift', 'kotlin'],
    'JavaScript': ['javascript', 'js', 'jquery', 'typescript', 'ts']
};

/**
 * Classifica um projeto baseado na descrição e stack
 * @param {string} description - Descrição do projeto
 * @param {string} stack - Stack mencionada
 * @returns {Object} - Classificação com complexidade e motivos
 */
function classify(description, stack) {
    const text = `${description} ${stack}`.toLowerCase();

    let complexity = 'médio'; // Default
    let reasons = [];
    let scores = {
        simples: 0,
        médio: 0,
        complexo: 0,
        arriscado: 0
    };

    // Conta matches para cada nível de complexidade
    for (const [level, keywords] of Object.entries(COMPLEXITY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                scores[level]++;
                reasons.push(`"${keyword}" detectado → ${level}`);
            }
        }
    }

    // Determina complexidade baseada nos scores
    // Arriscado tem prioridade, depois complexo, médio, simples
    if (scores.arriscado >= 2) {
        complexity = 'arriscado';
    } else if (scores.complexo >= 2 || (scores.complexo >= 1 && scores.arriscado >= 1)) {
        complexity = 'complexo';
    } else if (scores.simples >= 2 && scores.complexo === 0) {
        complexity = 'simples';
    } else if (scores.médio >= 1 || scores.complexo >= 1) {
        complexity = 'médio';
    } else if (scores.simples >= 1) {
        complexity = 'simples';
    }

    // Análise de tamanho da descrição
    const wordCount = description.split(/\s+/).length;
    if (wordCount < 20 && complexity === 'médio') {
        reasons.push('Descrição muito curta - pode indicar projeto simples ou falta de clareza');
    }
    if (wordCount > 200 && complexity !== 'complexo') {
        reasons.push('Descrição detalhada - projeto pode ser mais complexo que aparenta');
        if (complexity === 'simples') {
            complexity = 'médio';
        }
    }

    // Análise de stack
    const detectedStacks = detectStacks(text);
    if (detectedStacks.length > 2) {
        reasons.push(`Múltiplas tecnologias detectadas (${detectedStacks.join(', ')}) - aumenta complexidade`);
        if (complexity === 'simples') {
            complexity = 'médio';
        }
    }

    return {
        complexity,
        reasons: reasons.slice(0, 5), // Limita a 5 motivos
        scores,
        detectedStacks
    };
}

/**
 * Detecta stacks mencionadas no texto
 * @param {string} text - Texto para análise
 * @returns {string[]} - Lista de stacks detectadas
 */
function detectStacks(text) {
    const detected = [];
    const textLower = text.toLowerCase();

    for (const [stack, keywords] of Object.entries(STACK_KEYWORDS)) {
        for (const keyword of keywords) {
            if (textLower.includes(keyword)) {
                if (!detected.includes(stack)) {
                    detected.push(stack);
                }
                break;
            }
        }
    }

    return detected;
}

/**
 * Verifica se o projeto tem indicadores de risco
 * @param {string} description - Descrição do projeto
 * @returns {Object} - Indicadores de risco
 */
function checkRiskIndicators(description) {
    const text = description.toLowerCase();

    const indicators = {
        urgencia: false,
        ambiguidade: false,
        complexidadeAlta: false,
        orcamentoIrreal: false
    };

    // Checa urgência
    const urgencyWords = ['urgente', 'para ontem', 'prazo curto', 'asap', 'imediato', 'hoje'];
    indicators.urgencia = urgencyWords.some(word => text.includes(word));

    // Checa ambiguidade
    const ambiguityWords = ['mais ou menos', 'tipo', 'algo assim', 'não sei bem', 'acho que'];
    indicators.ambiguidade = ambiguityWords.some(word => text.includes(word));

    // Checa complexidade não declarada
    const complexWords = ['simples', 'fácil', 'rápido', 'básico'];
    const actuallyComplex = ['integração', 'api', 'sistema', 'múltiplos', 'completo'];
    const saysSimple = complexWords.some(word => text.includes(word));
    const isComplex = actuallyComplex.some(word => text.includes(word));
    indicators.complexidadeAlta = saysSimple && isComplex;

    // Checa orçamento x funcionalidades
    const budgetMatch = text.match(/r\$\s*(\d+)/);
    const features = (text.match(/,/g) || []).length; // Conta features por vírgulas
    if (budgetMatch && features > 5 && parseInt(budgetMatch[1]) < 500) {
        indicators.orcamentoIrreal = true;
    }

    return indicators;
}

module.exports = {
    classify,
    detectStacks,
    checkRiskIndicators,
    COMPLEXITY_KEYWORDS,
    STACK_KEYWORDS
};
