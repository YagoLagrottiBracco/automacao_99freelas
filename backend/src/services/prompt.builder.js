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
Sou freelancer em tempo integral e estou disponível para atender suas demandas a qualquer momento. Tenho experiência em diversas áreas do desenvolvimento e estou pronto para ajudar no seu projeto.

{i}Confira meu portfólio:{/i}
{q}https://lagrotti.dev{/q}
{q}https://www.linkedin.com/in/yago-lagrotti-bracco{/q}

{i}Agende uma reunião comigo para conversarmos sobre o seu projeto:{/i}
https://calendly.com/techworkydigital/orcamento

{i}Fico no aguardo do seu retorno. Desde já, {b}muito obrigado!{/b}{/i}
{/pre}`;

/**
 * Constrói o prompt para a OpenAI
 * @param {Object} projectData - Dados do projeto
 * @param {Object} rulesResult - Resultado das regras de negócio
 * @returns {string} - Prompt completo
 */
function build(projectData, rulesResult) {
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

    const systemPrompt = buildSystemPrompt();
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
 * @returns {string} - System prompt
 */
function buildSystemPrompt() {
    return `Você é um assistente especializado em criar propostas profissionais para projetos de desenvolvimento web e software.

Sua tarefa é gerar APENAS o texto de explicação do projeto (#TEXTODEEXPLICAÇÃO) que será inserido no template da proposta.

REGRAS IMPORTANTES:
1. O texto deve ser profissional, objetivo e personalizado para o projeto
2. Deve demonstrar entendimento do problema do cliente
3. Deve mencionar as tecnologias relevantes quando apropriado
4. Deve ser conciso (máximo 200 palavras)
5. NÃO inclua saudações ou despedidas (já estão no template)
6. NÃO inclua links de portfólio (já estão no template)
7. NÃO mencione prazos ou valores diretamente no texto
8. Foque em demonstrar competência técnica e entendimento do projeto

FORMATO DE RESPOSTA (JSON):
{
  "textoExplicacao": "Texto da explicação aqui...",
  "prazo": número em dias,
  "valor": número em reais (ou null se não aplicável)
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
2. Demonstre entendimento do problema e como você pode resolver
3. Mencione sua experiência com ${stackRecomendada} de forma natural
4. Seja objetivo e direto

Responda APENAS com o JSON no formato especificado.`;

    return prompt;
}

/**
 * Monta a proposta final com o texto gerado
 * @param {string} nomeCliente - Nome do cliente
 * @param {string} textoExplicacao - Texto de explicação gerado pela IA
 * @returns {string} - Proposta completa
 */
function assembleProposal(nomeCliente, textoExplicacao) {
    return PROPOSAL_TEMPLATE
        .replace('#NOMEDOCLIENTE', nomeCliente || 'Cliente')
        .replace('#TEXTODEEXPLICAÇÃO', textoExplicacao);
}

module.exports = {
    build,
    buildSystemPrompt,
    buildUserPrompt,
    assembleProposal,
    PROPOSAL_TEMPLATE
};
