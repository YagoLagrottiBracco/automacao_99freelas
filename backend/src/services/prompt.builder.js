/**
 * Prompt Builder - Construtor de Prompts para OpenAI
 * 
 * Monta prompts otimizados para geração de propostas
 */

/**
 * Template da proposta (IMUTÁVEL - apenas #NOMEDOCLIENTE e #TEXTODEEXPLICAÇÃO podem ser alterados)
 */
const PROPOSAL_TEMPLATE = `{i}{b}Olá{/b}, {u}#NOMEDOCLIENTE{/u}, tudo bem? Espero que sim!{/i}

{code}
#TEXTODEEXPLICAÇÃO
{/code}

{pre}
Sou freelancer dedicado e estou disponível para atender suas demandas com agilidade e qualidade. Tenho experiência prática nas habilidades necessárias para o seu projeto.

{i}Confira meu portfólio:{/i}
{q}{LINK_PORTFOLIO}{/q}
{q}{LINK_LINKEDIN}{/q}

{i}Agende uma reunião comigo para conversarmos sobre o seu projeto:{/i}
{LINK_MEETING}

{i}Fico no aguardo do seu retorno. Desde já, {b}muito obrigado!{/b}{/i}
{/pre}`;

/**
 * Constrói o prompt para a OpenAI
 * @param {Object} projectData - Dados do projeto
 * @param {Object} rulesResult - Resultado das regras de negócio
 * @param {Object} userConfig - Configurações do usuário (systemPrompt, proposalTemplate)
 * @returns {string} - Prompt completo
 */
function build(projectData, rulesResult, userConfig = {}) {
    const {
        nomeCliente,
        tituloProjeto,
        descricaoProjeto,
        stackMencionada,
        orcamentoInformado,
        prazoInformado
    } = projectData;

    const {
        complexidade,
        viabilidade,
        prazoSugerido,
        valorSugerido,
        stackRecomendada,
        sugestaoStack,
        nivelConhecimento
    } = rulesResult;

    const systemPrompt = buildSystemPrompt(userConfig.systemPrompt, userConfig.userRole);
    const userPrompt = buildUserPrompt(
        nomeCliente,
        tituloProjeto,
        descricaoProjeto,
        stackMencionada,
        stackRecomendada,
        sugestaoStack,
        complexidade,
        nivelConhecimento,
        orcamentoInformado,
        prazoInformado,
        valorSugerido,
        prazoSugerido
    );

    return {
        system: systemPrompt,
        user: userPrompt
    };
}

/**
 * Constrói o system prompt
 * @param {string} customPrompt - Prompt personalizado do usuário
 * @param {string} userRole - Papel profissional do usuário (developer, copywriter, etc)
 * @returns {string} - System prompt
 */
function buildSystemPrompt(customPrompt, userRole = 'developer') {
    if (customPrompt && customPrompt.trim().length > 10) {
        return `${customPrompt}

REGRAS OBRIGATÓRIAS:
1. Gere APENAS um JSON válido.
2. Explicação máx 200 palavras.
3. SEM saudações no texto da explicação.

RESPOSTA (JSON):
{ "textoExplicacao": "...", "duvidaPertinente": "...", "prazo": 10, "valor": 1000 }`;
    }

    const roles = {
        'developer': 'desenvolvimento de software e web',
        'copywriter': 'redação, copywriting e produção de conteúdo',
        'designer': 'design gráfico, UI/UX e identidade visual',
        'translator': 'tradução e localização de conteúdo',
        'marketing': 'marketing digital, gestão de tráfego e growth',
        'other': 'serviços freelance'
    };

    const area = roles[userRole] || roles['other'];

    return `Você é um assistente especializado em criar propostas comerciais persuasivas para freelancers de ${area}.

Sua tarefa é gerar:
1. O texto de explicação do projeto (#TEXTODEEXPLICAÇÃO) que será inserido no corpo da proposta.
2. Uma dúvida pertinente ({DUVIDA_PERTINENTE}) para engajar o cliente.

REGRAS:
1. O texto deve ser profissional, persuasivo e focado na solução do problema do cliente.
2. Demonstre autoridade na área de ${area}.
3. NÃO inclua saudações ou despedidas (já estão no template).

RESPOSTA (JSON):
{
  "textoExplicacao": "Texto da explicação aqui...",
  "duvidaPertinente": "Pergunta estratégica...",
  "prazo": número (dias),
  "valor": número (reais) ou null
}`;
}

/**
 * Constrói o user prompt
 * @returns {string} - User prompt
 */
function buildUserPrompt(
    nomeCliente,
    tituloProjeto,
    descricaoProjeto,
    stackMencionada,
    stackRecomendada,
    sugestaoStack,
    complexidade,
    nivelConhecimento,
    orcamentoInformado,
    prazoInformado,
    valorSugerido,
    prazoSugerido
) {
    let prompt = `DADOS DO PROJETO:

Cliente: ${nomeCliente || 'Não informado'}
Título: ${tituloProjeto}
Descrição: ${descricaoProjeto || 'Não informada'}

Stack Mencionada: ${stackMencionada || 'Não identificada'}
Stack Recomendada: ${stackRecomendada}
${sugestaoStack ? `Sugestão de Stack: ${sugestaoStack}` : ''}

Complexidade: ${complexidade}
Nível de Conhecimento: ${nivelConhecimento}

${orcamentoInformado ? `Orçamento do Cliente: R$ ${orcamentoInformado}` : 'Orçamento: Não informado'}
${prazoInformado ? `Prazo do Cliente: ${prazoInformado} dias` : 'Prazo: Não informado'}

VALORES SUGERIDOS (baseados nas regras de negócio):
- Prazo Sugerido: ${prazoSugerido} dias
${valorSugerido ? `- Valor Sugerido: R$ ${valorSugerido}` : '- Valor: A definir com o cliente'}

INSTRUÇÕES:
1. Crie um texto de explicação profissional para este projeto
2. Crie UMA dúvida pertinente (técnica ou de negócio) que mostre interesse e experiência
3. Mencione sua experiência com ${stackRecomendada} de forma natural
4. Seja objetivo e direto

Responda APENAS com o JSON no formato especificado.`;

    return prompt;
}

/**
 * Monta a proposta final com o texto gerado
 * @param {string} nomeCliente - Nome do cliente
 * @param {string} textoExplicacao - Texto de explicação gerado pela IA
 * @param {Object} projectData - Dados completos do projeto (para variáveis extras)
 * @param {Object} rulesResult - Dados da regra (para variáveis extras)
 * @param {string} customTemplate - Template personalizado
 * @param {string} duvidaPertinente - Dúvida gerada pela IA
 * @returns {string} - Proposta completa
 */
function assembleProposal(nomeCliente, textoExplicacao, projectData, rulesResult, customTemplate, duvidaPertinente, userConfig = {}) {
    let template = customTemplate || PROPOSAL_TEMPLATE;

    // Variáveis disponíveis
    const variables = {
        '#NOMEDOCLIENTE': nomeCliente || 'Cliente',
        '{NOME_CLIENTE}': nomeCliente || 'Cliente',
        '#TEXTODEEXPLICAÇÃO': textoExplicacao,
        '{TEXTO_EXPLICACAO}': textoExplicacao,
        '{TITULO_PROJETO}': projectData?.tituloProjeto || 'seu projeto',
        '{STACK_TECNOLOGICA}': rulesResult?.stackRecomendada || 'tecnologias modernas',
        '{ANALISE_TECNICA}': textoExplicacao, // Alias
        '{DUVIDA_PERTINENTE}': duvidaPertinente || 'Gostaria de saber mais detalhes sobre o escopo?',
        '{PRAZO}': rulesResult?.prazoSugerido ? `${rulesResult.prazoSugerido} dias` : 'a combinar',
        '{VALOR}': rulesResult?.valorSugerido ? `R$ ${rulesResult.valorSugerido}` : 'a combinar',
        '{LINK_PORTFOLIO}': userConfig?.links?.portfolio || 'https://meu-portfolio.com',
        '{LINK_LINKEDIN}': userConfig?.links?.linkedin || 'https://linkedin.com',
        '{LINK_MEETING}': userConfig?.links?.meeting || 'Link para reunião a combinar'
    };

    // Substituição
    let proposal = template;
    for (const [key, value] of Object.entries(variables)) {
        proposal = proposal.split(key).join(value); // Replace all
    }

    return proposal;
}

module.exports = {
    build,
    buildSystemPrompt,
    buildUserPrompt,
    assembleProposal,
    PROPOSAL_TEMPLATE
};
