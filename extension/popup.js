/**
 * Popup Script - 99Freelas Proposal Assistant
 * 
 * Gerencia a interface do popup e comunicação com o content script e backend
 */

(function () {
    'use strict';

    // Configurações
    const CONFIG = {
        backendUrl: 'https://automacao-99freelas.onrender.com',
        endpoints: {
            analyze: '/api/analyze'
        }
    };

    // Estado da aplicação
    let state = {
        projectData: null,
        analysisResult: null,
        isLoading: false,
        userStatus: null // Dados do usuário
    };

    // Elementos do DOM
    const elements = {
        // Status
        statusBar: document.getElementById('status-bar'),
        statusIcon: document.getElementById('status-icon'),
        statusText: document.getElementById('status-text'),
        errorContainer: document.getElementById('error-container'),
        errorMessage: document.getElementById('error-message'),

        // Project Data
        projectSection: document.getElementById('project-section'),
        clienteName: document.getElementById('cliente-name'),
        projectTitle: document.getElementById('project-title'),
        projectStack: document.getElementById('project-stack'),
        projectBudget: document.getElementById('project-budget'),
        projectDeadline: document.getElementById('project-deadline'),
        projectDescriptionContainer: document.getElementById('project-description-container'),
        projectDescription: document.getElementById('project-description'),

        // Analysis
        analysisSection: document.getElementById('analysis-section'),
        loadingContainer: document.getElementById('loading-container'),

        // Result
        resultSection: document.getElementById('result-section'),
        resultComplexity: document.getElementById('result-complexity'),
        resultViability: document.getElementById('result-viability'),
        resultValue: document.getElementById('result-value'),
        resultDeadline: document.getElementById('result-deadline'),
        proposalPreview: document.getElementById('proposal-preview'),

        // Skip
        skipSection: document.getElementById('skip-section'),

        // Buttons
        btnExtract: document.getElementById('btn-extract'),
        btnAnalyze: document.getElementById('btn-analyze'),
        btnFill: document.getElementById('btn-fill'),
        btnCopy: document.getElementById('btn-copy'),

        // Toggle
        modeToggle: document.getElementById('mode-toggle')
    };

    /**
     * Mostra mensagem de status
     */
    function showStatus(message, icon = '⏳') {
        elements.statusIcon.textContent = icon;
        elements.statusText.textContent = message;
        elements.statusBar.classList.remove('hidden');
        elements.errorContainer.classList.add('hidden');
    }

    /**
     * Esconde mensagem de status
     */
    function hideStatus() {
        elements.statusBar.classList.add('hidden');
    }

    /**
     * Mostra mensagem de erro
     */
    function showError(message) {
        elements.errorMessage.textContent = message;
        elements.errorContainer.classList.remove('hidden');
        elements.statusBar.classList.add('hidden');
    }

    /**
     * Esconde mensagem de erro
     */
    function hideError() {
        elements.errorContainer.classList.add('hidden');
    }

    /**
     * Formata valor em reais
     */
    function formatCurrency(value) {
        if (!value) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    /**
     * Formata prazo em dias
     */
    function formatDeadline(days) {
        if (!days) return '-';
        return `${days} dia${days > 1 ? 's' : ''}`;
    }

    /**
     * Obtém a aba ativa
     */
    async function getActiveTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
    }

    /**
     * Envia mensagem para o content script
     */
    async function sendMessageToContent(action, data = {}) {
        const tab = await getActiveTab();

        if (!tab) {
            throw new Error('Nenhuma aba ativa encontrada');
        }

        // Verifica se estamos em uma página do 99freelas
        if (!tab.url?.includes('99freelas.com.br/project')) {
            throw new Error('Navegue até uma página de projeto do 99freelas');
        }

        try {
            // Tenta injetar o content script se não estiver carregado
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
        } catch (e) {
            // Script já pode estar injetado, continue
        }

        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tab.id, { action, data }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (!response) {
                    reject(new Error('Sem resposta do content script'));
                } else if (!response.success) {
                    reject(new Error(response.error || 'Erro desconhecido'));
                } else {
                    resolve(response);
                }
            });
        });
    }

    /**
     * Extrai dados do projeto
     */
    async function extractProjectData() {
        try {
            hideError();
            showStatus('Extraindo dados...', '🔍');

            const response = await sendMessageToContent('extractData');
            state.projectData = response.data;

            // Atualiza a interface
            elements.clienteName.textContent = state.projectData.nomeCliente || '-';
            elements.projectTitle.textContent = state.projectData.tituloProjeto || '-';
            elements.projectStack.textContent = state.projectData.stackMencionada || '-';
            elements.projectBudget.textContent = formatCurrency(state.projectData.orcamentoInformado);
            elements.projectDeadline.textContent = formatDeadline(state.projectData.prazoInformado);

            if (state.projectData.descricaoProjeto) {
                elements.projectDescription.textContent = state.projectData.descricaoProjeto;
                elements.projectDescriptionContainer.classList.remove('hidden');
            }

            // Mostra seção de análise
            elements.analysisSection.classList.remove('hidden');

            showStatus('Dados extraídos com sucesso!', '✅');
            setTimeout(hideStatus, 2000);

        } catch (error) {
            showError(error.message);
            console.error('Erro ao extrair dados:', error);
        }
    }

    /**
     * Analisa o projeto com IA
     */
    async function analyzeProject() {
        if (!state.projectData) {
            showError('Extraia os dados do projeto primeiro');
            return;
        }

        try {
            hideError();
            state.isLoading = true;
            elements.loadingContainer.classList.remove('hidden');
            elements.btnAnalyze.disabled = true;

            // Carrega auth token e userConfig
            const storageData = await new Promise(resolve => {
                chrome.storage.local.get(['userConfig', 'session'], (result) => resolve(result));
            });

            const userConfig = storageData.userConfig || {};
            const token = storageData.session?.access_token;

            const response = await fetch(`${CONFIG.backendUrl}${CONFIG.endpoints.analyze}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...state.projectData,
                    userConfig
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
            }

            const result = await response.json();
            state.analysisResult = result;

            // Verifica viabilidade
            if (result.viabilidade === 'inviável' || result.textoProposta?.includes('este projeto você pula')) {
                elements.skipSection.classList.remove('hidden');
                elements.resultSection.classList.add('hidden');
            } else {
                displayResult(result);
                elements.resultSection.classList.remove('hidden');
                elements.skipSection.classList.add('hidden');
            }

        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                showError('Não foi possível conectar ao backend. Verifique se o servidor está rodando.');
            } else {
                showError(error.message);
            }
            console.error('Erro ao analisar projeto:', error);
        } finally {
            state.isLoading = false;
            elements.loadingContainer.classList.add('hidden');
            elements.btnAnalyze.disabled = false;
        }
    }

    /**
     * Exibe o resultado da análise
     */
    function displayResult(result) {
        // Complexidade com badge colorido
        elements.resultComplexity.textContent = result.complexidade || '-';
        elements.resultComplexity.className = `result-value badge badge-${getComplexityClass(result.complexidade)}`;

        // Viabilidade com badge colorido
        elements.resultViability.textContent = result.viabilidade || '-';
        elements.resultViability.className = `result-value badge badge-${getViabilityClass(result.viabilidade)}`;

        // Valor e prazo
        elements.resultValue.textContent = formatCurrency(result.valor);
        elements.resultDeadline.textContent = formatDeadline(result.prazo);

        // Proposta
        elements.proposalPreview.innerHTML = formatProposalForDisplay(result.textoProposta);
    }

    /**
     * Retorna classe CSS baseada na complexidade
     */
    function getComplexityClass(complexity) {
        const classes = {
            'simples': 'success',
            'médio': 'warning',
            'complexo': 'danger',
            'arriscado': 'danger'
        };
        return classes[complexity?.toLowerCase()] || 'default';
    }

    /**
     * Retorna classe CSS baseada na viabilidade
     */
    function getViabilityClass(viability) {
        const viabilityLower = viability?.toLowerCase();
        if (viabilityLower?.includes('viável') && !viabilityLower?.includes('inviável')) {
            return 'success';
        }
        if (viabilityLower?.includes('inviável')) {
            return 'danger';
        }
        return 'warning';
    }

    /**
     * Formata proposta para exibição (converte tags BBCode para HTML)
     */
    function formatProposalForDisplay(text) {
        if (!text) return '';

        return text
            .replace(/\{b\}/g, '<strong>')
            .replace(/\{\/b\}/g, '</strong>')
            .replace(/\{i\}/g, '<em>')
            .replace(/\{\/i\}/g, '</em>')
            .replace(/\{u\}/g, '<u>')
            .replace(/\{\/u\}/g, '</u>')
            .replace(/\{code\}/g, '<pre class="code-block">')
            .replace(/\{\/code\}/g, '</pre>')
            .replace(/\{pre\}/g, '<div class="pre-block">')
            .replace(/\{\/pre\}/g, '</div>')
            .replace(/\{q\}/g, '<blockquote>')
            .replace(/\{\/q\}/g, '</blockquote>')
            .replace(/\n/g, '<br>');
    }

    /**
     * Preenche o formulário de proposta
     */
    async function fillProposalForm() {
        if (!state.analysisResult) {
            showError('Analise o projeto primeiro');
            return;
        }

        try {
            showStatus('Preenchendo formulário...', '📝');

            await sendMessageToContent('fillForm', state.analysisResult);

            showStatus('Formulário preenchido! Revise e envie manualmente.', '✅');
            setTimeout(hideStatus, 3000);

        } catch (error) {
            showError(error.message);
            console.error('Erro ao preencher formulário:', error);
        }
    }

    /**
     * Copia texto da proposta
     */
    async function copyProposalText() {
        if (!state.analysisResult?.textoProposta) {
            showError('Nenhuma proposta para copiar');
            return;
        }

        try {
            await navigator.clipboard.writeText(state.analysisResult.textoProposta);
            showStatus('Texto copiado para a área de transferência!', '📋');
            setTimeout(hideStatus, 2000);
        } catch (error) {
            showError('Não foi possível copiar o texto');
        }
    }

    /**
     * Inicializa event listeners
     */
    function initEventListeners() {
        elements.btnExtract.addEventListener('click', extractProjectData);
        elements.btnAnalyze.addEventListener('click', analyzeProject);
        elements.btnFill.addEventListener('click', fillProposalForm);
        elements.btnCopy.addEventListener('click', copyProposalText);

        // Options Button
        const btnOptions = document.getElementById('btn-options');
        if (btnOptions) {
            btnOptions.addEventListener('click', () => {
                // Abre em nova aba para garantir compatibilidade
                window.open('options.html', '_blank');
            });
        }

        // Toggle Listener
        if (elements.modeToggle) {
            elements.modeToggle.addEventListener('change', (e) => {
                const autoMode = e.target.checked;
                chrome.storage.local.set({ autoMode }, () => {
                    // Opcional: Notificar content script diretamente se necessário, 
                    // mas o storage.onChanged no content script deve lidar com isso.
                });
            });
        }
    }

    /**
     * Carrega configurações salvas
     */
    function loadSettings() {
        chrome.storage.local.get(['autoMode'], (result) => {
            // Default to true (automático) se não definido
            const autoMode = result.autoMode !== false;
            if (elements.modeToggle) {
                elements.modeToggle.checked = autoMode;
            }
        });
    }

    // Novos Elementos
    const userElements = {
        userEmail: document.getElementById('user-email'),
        userBadge: document.getElementById('user-badge'),
        btnLogout: document.getElementById('btn-logout'),
        upgradeOverlay: document.getElementById('upgrade-overlay'),
        btnSubscribeOverlay: document.getElementById('btn-subscribe-overlay'),
        linkLogoutOverlay: document.getElementById('link-logout-overlay')
    };

    /**
     * Busca dados do usuário no backend
     */
    async function fetchUserInfo(token) {
        try {
            const response = await fetch(`${CONFIG.backendUrl}/api/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                state.userStatus = data;
                updateUserInfoUI();
            } else {
                console.error('Erro ao buscar info do usuário');
            }
        } catch (error) {
            console.error('Erro fetchUserInfo:', error);
        }
    }

    /**
     * Atualiza a UI com dados do usuário
     */
    function updateUserInfoUI() {
        if (!state.userStatus) return;

        userElements.userEmail.textContent = state.userStatus.email;

        // Badge logic
        const status = state.userStatus.status;
        const remaining = state.userStatus.trial_remaining;

        userElements.userBadge.className = 'badge ' + status;

        if (status === 'premium') {
            userElements.userBadge.textContent = 'PREMIUM';
        } else if (status === 'trial') {
            userElements.userBadge.textContent = `TRIAL (${remaining} RESTANTES)`;
        } else if (status === 'expired') {
            userElements.userBadge.textContent = 'EXPIRADO';
            showUpgradeOverlay();
        }
    }

    function showUpgradeOverlay() {
        userElements.upgradeOverlay.classList.remove('hidden');
    }

    async function handleLogout() {
        await new Promise(resolve => chrome.storage.local.remove(['session', 'user'], resolve));
        window.location.href = 'login.html';
    }

    async function handleSubscribe() {
        // Redireciona para checkout (precisamos criar esse endpoint de create-checkout-session no content ou aqui)
        // Como o botão abre nova aba, podemos chamar o backend para pegar a URL e abrir
        try {
            const storageData = await new Promise(r => chrome.storage.local.get(['session'], r));
            const token = storageData.session?.access_token;

            const response = await fetch(`${CONFIG.backendUrl}/api/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.url) {
                window.open(data.url, '_blank');
            } else {
                alert('Erro ao iniciar pagamento. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro no subscribe:', error);
            alert('Erro ao conectar com servidor de pagamento.');
        }
    }

    /**
     * Verifica e gerencia autenticação
     */
    async function checkAuth() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['session'], (result) => {
                if (!result.session || !result.session.access_token) {
                    window.location.href = 'login.html';
                    resolve(null);
                } else {
                    resolve(result.session.access_token);
                }
            });
        });
    }

    /**
     * Verifica se estamos em uma página válida
     */
    async function checkValidPage() {
        try {
            const tab = await getActiveTab();
            if (!tab?.url?.includes('99freelas.com.br/project')) {
                showError('Navegue até uma página de projeto do 99freelas');
                elements.btnExtract.disabled = true;
            }
        } catch (error) {
            console.error('Erro ao verificar página:', error);
        }
    }

    // Inicialização
    document.addEventListener('DOMContentLoaded', async () => {
        const token = await checkAuth();
        if (!token) return;

        // Listeners novos
        userElements.btnLogout.addEventListener('click', handleLogout);
        userElements.linkLogoutOverlay.addEventListener('click', handleLogout);
        userElements.btnSubscribeOverlay.addEventListener('click', handleSubscribe);

        // Carrega dados iniciais
        fetchUserInfo(token);
        loadSettings();
        initEventListeners();
        checkValidPage();
    });
})();
