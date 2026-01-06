/**
 * Options Script - 99Freelas Proposal Assistant
 * Gerencia o salvamento e carregamento das configurações do usuário
 */

const DEFAULT_CONFIG = {
    whitelist: [],
    blacklist: [],
    systemPrompt: '',
    proposalTemplate: '',
    valueAdjustment: 0,
    deadlineAdjustment: 0,
    userRole: 'developer',
    links: {
        portfolio: '',
        linkedin: '',
        meeting: ''
    }
};

const DEFAULT_TEMPLATE = `Olá, tudo bem?

Vi seu projeto "{TITULO_PROJETO}" e tenho interesse!

{ANALISE_TECNICA}

Tenho experiência com {STACK_TECNOLOGICA} e posso entregar exatamente o que você precisa.

Uma dúvida: {DUVIDA_PERTINENTE}

Vamos conversar?
Atenciosamente.`;

// Estado
let config = { ...DEFAULT_CONFIG };

// Elementos
const elements = {
    whitelistInput: document.getElementById('whitelist-input'),
    whitelistContainer: document.getElementById('whitelist-container'),
    blacklistInput: document.getElementById('blacklist-input'),
    blacklistContainer: document.getElementById('blacklist-container'),
    systemPrompt: document.getElementById('system-prompt'),
    proposalTemplate: document.getElementById('proposal-template'),
    valueAdjustment: document.getElementById('value-adjustment'),
    deadlineAdjustment: document.getElementById('deadline-adjustment'),
    saveBtn: document.getElementById('save-btn'),
    resetTemplateBtn: document.getElementById('reset-template-btn'),
    statusMessage: document.getElementById('status-message'),
    tabs: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    // New fields
    userRole: document.getElementById('user-role'),
    linkPortfolio: document.getElementById('link-portfolio'),
    linkLinkedin: document.getElementById('link-linkedin'),
    linkMeeting: document.getElementById('link-meeting')
};

// Inicialização
document.addEventListener('DOMContentLoaded', restoreOptions);

// Event Listeners
elements.saveBtn.addEventListener('click', saveOptions);
elements.resetTemplateBtn.addEventListener('click', () => {
    elements.proposalTemplate.value = DEFAULT_TEMPLATE;
});

// Tags Input Listeners
setupTagsInput(elements.whitelistInput, elements.whitelistContainer, 'whitelist', 'tag-whitelist');
setupTagsInput(elements.blacklistInput, elements.blacklistContainer, 'blacklist', 'tag-blacklist');

// Tabs Navigation
elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        elements.tabs.forEach(t => t.classList.remove('active'));
        elements.tabContents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

/**
 * Configura input de tags
 */
function setupTagsInput(input, container, configKey, tagClass) {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = input.value.trim();
            if (value && !config[configKey].includes(value)) {
                config[configKey].push(value);
                renderTags(container, config[configKey], tagClass, configKey);
                input.value = '';
            }
        }
    });

    // Remove tag com backspace se input vazio
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value === '' && config[configKey].length > 0) {
            config[configKey].pop();
            renderTags(container, config[configKey], tagClass, configKey);
        }
    });
}

/**
 * Renderiza tags no container
 */
function renderTags(container, tags, tagClass, configKey) {
    // Mantém o input, remove as tags antigas (elementos anteriores ao input)
    while (container.firstChild !== container.lastElementChild) {
        container.removeChild(container.firstChild);
    }

    tags.forEach(tag => {
        const tagEl = document.createElement('div');
        tagEl.className = `tag ${tagClass}`;
        tagEl.innerHTML = `
            ${tag}
            <span class="tag-remove">×</span>
        `;

        tagEl.querySelector('.tag-remove').addEventListener('click', () => {
            config[configKey] = config[configKey].filter(t => t !== tag);
            renderTags(container, config[configKey], tagClass, configKey);
        });

        container.insertBefore(tagEl, container.lastElementChild);
    });
}

/**
 * Salva configurações no chrome.storage
 */
function saveOptions() {
    config.systemPrompt = elements.systemPrompt.value;
    config.proposalTemplate = elements.proposalTemplate.value;
    config.valueAdjustment = parseInt(elements.valueAdjustment.value) || 0;
    config.deadlineAdjustment = parseInt(elements.deadlineAdjustment.value) || 0;

    // New fields
    config.userRole = elements.userRole.value;
    config.links = {
        portfolio: elements.linkPortfolio.value,
        linkedin: elements.linkLinkedin.value,
        meeting: elements.linkMeeting.value
    };

    chrome.storage.local.set({ userConfig: config }, () => {
        showStatus('Configurações salvas com sucesso!');
    });
}

/**
 * Restaura configurações do chrome.storage
 */
function restoreOptions() {
    chrome.storage.local.get(['userConfig'], (result) => {
        if (result.userConfig) {
            config = { ...DEFAULT_CONFIG, ...result.userConfig };
        }

        // Renderiza Tags
        renderTags(elements.whitelistContainer, config.whitelist, 'tag-whitelist', 'whitelist');
        renderTags(elements.blacklistContainer, config.blacklist, 'tag-blacklist', 'blacklist');

        // Preenche campos
        elements.systemPrompt.value = config.systemPrompt;
        elements.proposalTemplate.value = config.proposalTemplate || DEFAULT_TEMPLATE; // Usa default se vazio
        elements.valueAdjustment.value = config.valueAdjustment;
        elements.deadlineAdjustment.value = config.deadlineAdjustment;

        // New fields
        if (config.userRole) elements.userRole.value = config.userRole;
        if (config.links) {
            elements.linkPortfolio.value = config.links.portfolio || '';
            elements.linkLinkedin.value = config.links.linkedin || '';
            elements.linkMeeting.value = config.links.meeting || '';
        }
    });
}

/**
 * Mostra mensagem de status
 */
function showStatus(message) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.style.display = 'block';
    setTimeout(() => {
        elements.statusMessage.style.display = 'none';
    }, 2000);
}
