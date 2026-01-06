/**
 * Selectors Service
 * 
 * Centraliza os seletores CSS usados pela extensão.
 * Isso permite atualizar a lógica de extração sem precisar atualizar a extensão na store.
 */

const SELECTORS = {
    // Dados do projeto
    clientName: '.info-usuario.cliente .info-usuario-nome a span.name',
    projectTitle: 'h1.title .nome-projeto, .box-project-info-container-header h1.title .nome-projeto',
    projectDescription: '.item-text.project-description, .project-description.formatted-text',

    // Alternativas (para fallback)
    clientNameFallback: '.info-usuario.cliente a[href*="/user/"]',
    projectDescriptionFallback: '.box-detalhes .detalhes',

    // Informações adicionais (tabela)
    infoTable: '.info-adicionais table',

    // Valores médios (na div.information)
    averageInfo: '.generic.information',

    // Formulário de proposta
    proposalTextarea: '#proposta, textarea#proposta',
    proposalValue: '#oferta, input#oferta',
    proposalDeadline: '#duracao-estimada, input#duracao-estimada'
};

/**
 * Retorna os seletores atuais
 */
function getSelectors() {
    // Futuramente pode vir do banco de dados
    return SELECTORS;
}

module.exports = {
    getSelectors
};
