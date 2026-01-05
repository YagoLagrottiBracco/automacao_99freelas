/**
 * Content Script - 99Freelas Proposal Assistant
 * 
 * MODO AUTOMÁTICO:
 * - Detecta quando está em uma página de projeto
 * - Extrai dados automaticamente
 * - Envia para o backend
 * - Preenche o formulário automaticamente
 * - Mostra widget com resultados
 */

(function () {
  'use strict';

  // Configurações
  const CONFIG = {
    backendUrl: 'http://localhost:3000',
    endpoints: {
      analyze: '/api/analyze'
    },
    autoRun: true, // Rodar automaticamente ao carregar a página
    autoFill: true, // Preencher formulário automaticamente
    showWidget: true // Mostrar widget com resultados
  };

  /**
   * Seletores CSS para extração de dados - BASEADOS NO HTML REAL DO 99FREELAS
   */
  const SELECTORS = {
    // Dados do projeto
    clientName: '.info-usuario.cliente .info-usuario-nome a span.name',
    projectTitle: 'h1.title .nome-projeto, .box-project-info-container-header h1.title .nome-projeto',
    projectDescription: '.item-text.project-description, .project-description.formatted-text',

    // Informações adicionais (tabela)
    infoTable: '.info-adicionais table',

    // Valores médios (na div.information)
    averageInfo: '.generic.information',

    // Formulário de proposta
    proposalTextarea: '#proposta, textarea#proposta',
    proposalValue: '#oferta, input#oferta',
    proposalDeadline: '#duracao-estimada, input#duracao-estimada'
  };

  // Estado da extensão
  let state = {
    projectData: null,
    analysisResult: null,
    isProcessing: false,
    hasRun: false
  };

  /**
   * Cria e insere o widget flutuante na página
   */
  function createWidget() {
    // Remove widget anterior se existir
    const existingWidget = document.getElementById('nnf-assistant-widget');
    if (existingWidget) existingWidget.remove();

    const widget = document.createElement('div');
    widget.id = 'nnf-assistant-widget';
    widget.innerHTML = `
      <style>
        #nnf-assistant-widget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 320px;
          max-height: 500px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          z-index: 999999;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        #nnf-assistant-widget.minimized {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          cursor: pointer;
        }
        #nnf-assistant-widget.minimized .widget-content {
          display: none;
        }
        #nnf-assistant-widget.minimized .widget-minimized-icon {
          display: flex;
        }
        .widget-minimized-icon {
          display: none;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 28px;
        }
        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
        }
        .widget-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .widget-header-actions {
          display: flex;
          gap: 8px;
        }
        .widget-header button {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .widget-header button:hover {
          background: rgba(255,255,255,0.3);
        }
        .widget-body {
          padding: 16px;
          color: #e2e8f0;
          font-size: 13px;
          max-height: 350px;
          overflow-y: auto;
        }
        .widget-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 8px;
          margin-bottom: 12px;
        }
        .widget-status.loading {
          background: rgba(99, 102, 241, 0.1);
        }
        .widget-status.success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .widget-status.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .widget-status.skip {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(99, 102, 241, 0.3);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .widget-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        .widget-card {
          background: rgba(51, 65, 85, 0.5);
          padding: 10px;
          border-radius: 8px;
        }
        .widget-card-label {
          font-size: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .widget-card-value {
          font-size: 14px;
          font-weight: 600;
        }
        .widget-card-value.money {
          color: #10b981;
        }
        .widget-card-value.time {
          color: #f59e0b;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .badge-success { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .badge-warning { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .badge-danger { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .widget-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .widget-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .widget-btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
        }
        .widget-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
        .widget-btn-secondary {
          background: rgba(51, 65, 85, 0.8);
          color: #e2e8f0;
        }
        .widget-btn-secondary:hover {
          background: rgba(71, 85, 105, 0.8);
        }
        .widget-btn-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        .widget-client {
          font-size: 11px;
          color: #94a3b8;
          margin-bottom: 8px;
        }
        .widget-project-title {
          font-size: 13px;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 12px;
          line-height: 1.4;
        }
        .widget-filled-notice {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          padding: 10px;
          font-size: 12px;
          color: #10b981;
          text-align: center;
          margin-top: 12px;
        }
      </style>
      <div class="widget-minimized-icon">🚀</div>
      <div class="widget-content">
        <div class="widget-header">
          <h3>🚀 99Freelas Assistant</h3>
          <div class="widget-header-actions">
            <button id="nnf-widget-minimize" title="Minimizar">−</button>
            <button id="nnf-widget-close" title="Fechar">×</button>
          </div>
        </div>
        <div class="widget-body">
          <div id="nnf-widget-content">
            <div class="widget-status loading">
              <div class="spinner"></div>
              <span>Analisando projeto...</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(widget);

    // Event listeners
    document.getElementById('nnf-widget-minimize').addEventListener('click', () => {
      widget.classList.toggle('minimized');
    });

    document.getElementById('nnf-widget-close').addEventListener('click', () => {
      widget.remove();
    });

    widget.addEventListener('click', (e) => {
      if (widget.classList.contains('minimized')) {
        widget.classList.remove('minimized');
      }
    });

    return widget;
  }

  /**
   * Atualiza o conteúdo do widget
   */
  function updateWidget(content) {
    const widgetContent = document.getElementById('nnf-widget-content');
    if (widgetContent) {
      widgetContent.innerHTML = content;
    }
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
   * Extrai texto de um elemento
   */
  function extractText(selectorString) {
    const selectors = selectorString.split(',').map(s => s.trim());

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText;
          text = text.trim().replace(/\s+/g, ' ');
          return text;
        }
      } catch (e) { }
    }

    return '';
  }

  /**
   * Extrai valor da tabela de informações adicionais
   */
  function extractFromTable(label) {
    const table = document.querySelector(SELECTORS.infoTable);
    if (!table) return '';

    const rows = table.querySelectorAll('tr');
    for (const row of rows) {
      const th = row.querySelector('th');
      const td = row.querySelector('td');
      if (th && td && th.textContent.trim().toLowerCase().includes(label.toLowerCase())) {
        return td.textContent.trim();
      }
    }
    return '';
  }

  /**
   * Extrai valores médios
   */
  function extractAverages() {
    const infoDiv = document.querySelector(SELECTORS.averageInfo);
    if (!infoDiv) return { valorMedio: null, prazoMedio: null };

    const text = infoDiv.textContent || '';

    const valorMatch = text.match(/Valor médio das propostas:\s*R\$\s*([\d.,]+)/i);
    let valorMedio = null;
    if (valorMatch) {
      valorMedio = parseFloat(valorMatch[1].replace('.', '').replace(',', '.'));
    }

    const prazoMatch = text.match(/Duração média estimada:\s*(\d+)\s*dias?/i);
    let prazoMedio = null;
    if (prazoMatch) {
      prazoMedio = parseInt(prazoMatch[1], 10);
    }

    return { valorMedio, prazoMedio };
  }

  /**
   * Extrai valor numérico
   */
  function extractNumber(text) {
    if (!text) return null;
    if (text.toLowerCase().includes('aberto') || text === '-') return null;

    const cleaned = text.replace(/R\$\s*/gi, '')
      .replace(/[^\d.,]/g, '')
      .replace('.', '')
      .replace(',', '.');

    const number = parseFloat(cleaned);
    return isNaN(number) ? null : number;
  }

  /**
   * Detecta a stack
   */
  function detectStack(description, categoria) {
    const text = `${description} ${categoria}`.toLowerCase();

    const stacks = {
      'WordPress': ['wordpress', 'woocommerce', 'elementor', 'wp', 'tema wp', 'plugin wp'],
      'React': ['react', 'reactjs', 'react.js', 'next.js', 'nextjs', 'gatsby'],
      'Vue': ['vue', 'vuejs', 'vue.js', 'nuxt'],
      'Angular': ['angular', 'angularjs'],
      'Node.js': ['node', 'nodejs', 'node.js', 'express', 'nestjs'],
      'PHP': ['php', 'laravel', 'symfony', 'codeigniter', 'yii'],
      'Python': ['python', 'django', 'flask', 'fastapi'],
      'Java': ['java', 'spring', 'springboot'],
      '.NET': ['.net', 'dotnet', 'c#', 'csharp', 'asp.net'],
      'Ruby': ['ruby', 'rails', 'ruby on rails'],
      'Mobile': ['react native', 'flutter', 'ionic', 'android', 'ios', 'swift', 'kotlin'],
      'HTML/CSS': ['html', 'css', 'landing page', 'site institucional', 'página', 'responsivo']
    };

    const detected = [];

    for (const [stack, keywords] of Object.entries(stacks)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          detected.push(stack);
          break;
        }
      }
    }

    return detected.length > 0 ? detected.join(', ') : 'Não identificada';
  }

  /**
   * Decodifica entidades HTML
   */
  function decodeHtmlEntities(html) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
  }

  /**
   * Extrai dados do projeto
   */
  function extractProjectData() {
    let clientName = extractText(SELECTORS.clientName);
    if (!clientName) {
      const clientLink = document.querySelector('.info-usuario.cliente a[href*="/user/"]');
      if (clientLink) clientName = clientLink.textContent.trim();
    }

    let projectTitle = extractText(SELECTORS.projectTitle);
    projectTitle = decodeHtmlEntities(projectTitle);

    let projectDescription = '';
    const descElement = document.querySelector(SELECTORS.projectDescription);
    if (descElement) {
      projectDescription = descElement.getAttribute('data-content') || descElement.innerHTML;
      projectDescription = projectDescription.replace(/<br\s*\/?>/gi, '\n');
      projectDescription = projectDescription.replace(/<[^>]+>/g, '');
      projectDescription = decodeHtmlEntities(projectDescription);
      projectDescription = projectDescription.trim();
    }

    const orcamento = extractFromTable('Orçamento');
    const categoria = extractFromTable('Categoria');
    const subcategoria = extractFromTable('Subcategoria');
    const valorMinimo = extractFromTable('Valor Mínimo');

    const { valorMedio, prazoMedio } = extractAverages();
    const stack = detectStack(projectDescription, `${categoria} ${subcategoria}`);

    let orcamentoNum = extractNumber(orcamento);
    if (!orcamentoNum && valorMedio) {
      orcamentoNum = valorMedio;
    }

    return {
      nomeCliente: clientName || 'Cliente',
      tituloProjeto: projectTitle || 'Projeto sem título',
      descricaoProjeto: projectDescription || '',
      stackMencionada: stack,
      orcamentoInformado: orcamentoNum,
      prazoInformado: prazoMedio,
      categoria: categoria,
      subcategoria: subcategoria,
      valorMedio: valorMedio,
      prazoMedio: prazoMedio,
      valorMinimo: extractNumber(valorMinimo),
      urlProjeto: window.location.href
    };
  }

  /**
   * Preenche o formulário
   */
  function fillProposalForm(data) {
    const { textoProposta, prazo, valor } = data;

    const textarea = document.querySelector(SELECTORS.proposalTextarea);
    if (textarea) {
      textarea.value = textoProposta;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      textarea.dispatchEvent(new Event('keyup', { bubbles: true }));
    }

    const valueInput = document.querySelector(SELECTORS.proposalValue);
    if (valueInput && valor) {
      const valorFormatado = valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      valueInput.value = valorFormatado;
      valueInput.dispatchEvent(new Event('input', { bubbles: true }));
      valueInput.dispatchEvent(new Event('change', { bubbles: true }));
      valueInput.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    const deadlineInput = document.querySelector(SELECTORS.proposalDeadline);
    if (deadlineInput && prazo) {
      deadlineInput.value = prazo.toString();
      deadlineInput.dispatchEvent(new Event('input', { bubbles: true }));
      deadlineInput.dispatchEvent(new Event('change', { bubbles: true }));
      deadlineInput.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    return true;
  }

  /**
   * Retorna classe do badge baseado na complexidade
   */
  function getComplexityBadge(complexity) {
    const classes = {
      'simples': 'badge-success',
      'médio': 'badge-warning',
      'complexo': 'badge-danger',
      'arriscado': 'badge-danger'
    };
    return classes[complexity?.toLowerCase()] || 'badge-warning';
  }

  /**
   * Retorna classe do badge baseado na viabilidade
   */
  function getViabilityBadge(viability) {
    const v = viability?.toLowerCase();
    if (v?.includes('viável') && !v?.includes('inviável')) return 'badge-success';
    if (v?.includes('inviável')) return 'badge-danger';
    return 'badge-warning';
  }

  /**
   * Executa o fluxo completo automaticamente
   */
  async function runAutomation() {
    if (state.isProcessing || state.hasRun) return;

    state.isProcessing = true;
    state.hasRun = true;

    // Cria o widget
    if (CONFIG.showWidget) {
      createWidget();
    }

    try {
      // 1. Extrai dados
      updateWidget(`
        <div class="widget-status loading">
          <div class="spinner"></div>
          <span>Extraindo dados do projeto...</span>
        </div>
      `);

      await new Promise(r => setTimeout(r, 500)); // Pequeno delay para UI
      state.projectData = extractProjectData();

      // 2. Envia para o backend
      updateWidget(`
        <div class="widget-client">Cliente: ${state.projectData.nomeCliente}</div>
        <div class="widget-project-title">${state.projectData.tituloProjeto}</div>
        <div class="widget-status loading">
          <div class="spinner"></div>
          <span>Analisando com IA...</span>
        </div>
      `);

      const response = await fetch(`${CONFIG.backendUrl}${CONFIG.endpoints.analyze}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.projectData)
      });

      if (!response.ok) {
        throw new Error(`Erro do servidor: ${response.status}`);
      }

      state.analysisResult = await response.json();

      // 3. Verifica viabilidade
      if (state.analysisResult.viabilidade === 'inviável' ||
        state.analysisResult.textoProposta?.includes('este projeto você pula')) {
        updateWidget(`
          <div class="widget-client">Cliente: ${state.projectData.nomeCliente}</div>
          <div class="widget-project-title">${state.projectData.tituloProjeto}</div>
          <div class="widget-status skip">
            <span>⚠️</span>
            <span>Este projeto você pula.</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 10px;">
            A análise indicou que este projeto não é viável para você.
          </p>
        `);
        return;
      }

      // 4. Preenche o formulário automaticamente
      if (CONFIG.autoFill) {
        fillProposalForm(state.analysisResult);
      }

      // 5. Mostra resultado
      updateWidget(`
        <div class="widget-client">Cliente: ${state.projectData.nomeCliente}</div>
        <div class="widget-project-title">${state.projectData.tituloProjeto}</div>
        <div class="widget-status success">
          <span>✅</span>
          <span>Proposta gerada e preenchida!</span>
        </div>
        <div class="widget-grid">
          <div class="widget-card">
            <div class="widget-card-label">Complexidade</div>
            <div class="widget-card-value">
              <span class="badge ${getComplexityBadge(state.analysisResult.complexidade)}">
                ${state.analysisResult.complexidade || '-'}
              </span>
            </div>
          </div>
          <div class="widget-card">
            <div class="widget-card-label">Viabilidade</div>
            <div class="widget-card-value">
              <span class="badge ${getViabilityBadge(state.analysisResult.viabilidade)}">
                ${state.analysisResult.viabilidade || '-'}
              </span>
            </div>
          </div>
          <div class="widget-card">
            <div class="widget-card-label">Valor Sugerido</div>
            <div class="widget-card-value money">${formatCurrency(state.analysisResult.valor)}</div>
          </div>
          <div class="widget-card">
            <div class="widget-card-label">Prazo Sugerido</div>
            <div class="widget-card-value time">${state.analysisResult.prazo || '-'} dias</div>
          </div>
        </div>
        <div class="widget-filled-notice">
          ✅ Formulário preenchido! Revise e envie manualmente.
        </div>
        <div class="widget-actions">
          <button class="widget-btn widget-btn-secondary" id="nnf-copy-btn">📋 Copiar</button>
          <button class="widget-btn widget-btn-primary" id="nnf-refill-btn">🔄 Preencher</button>
        </div>
      `);

      // Adiciona event listeners para os botões
      document.getElementById('nnf-copy-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(state.analysisResult.textoProposta);
        document.getElementById('nnf-copy-btn').textContent = '✓ Copiado!';
        setTimeout(() => {
          document.getElementById('nnf-copy-btn').textContent = '📋 Copiar';
        }, 2000);
      });

      document.getElementById('nnf-refill-btn')?.addEventListener('click', () => {
        fillProposalForm(state.analysisResult);
        document.getElementById('nnf-refill-btn').textContent = '✓ Preenchido!';
        setTimeout(() => {
          document.getElementById('nnf-refill-btn').textContent = '🔄 Preencher';
        }, 2000);
      });

    } catch (error) {
      console.error('Erro na automação:', error);

      let errorMsg = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMsg = 'Backend não está rodando. Inicie com: npm start';
      }

      updateWidget(`
        <div class="widget-client">Cliente: ${state.projectData?.nomeCliente || '-'}</div>
        <div class="widget-project-title">${state.projectData?.tituloProjeto || 'Erro ao extrair dados'}</div>
        <div class="widget-status error">
          <span>❌</span>
          <span>Erro na análise</span>
        </div>
        <p style="color: #ef4444; font-size: 12px; margin-top: 10px;">
          ${errorMsg}
        </p>
        <div class="widget-actions">
          <button class="widget-btn widget-btn-primary" id="nnf-retry-btn">🔄 Tentar novamente</button>
        </div>
      `);

      document.getElementById('nnf-retry-btn')?.addEventListener('click', () => {
        state.hasRun = false;
        state.isProcessing = false;
        runAutomation();
      });

    } finally {
      state.isProcessing = false;
    }
  }

  /**
   * Verifica se está em uma página de projeto
   */
  function isProjectPage() {
    return window.location.href.includes('99freelas.com.br/project/') &&
      document.querySelector(SELECTORS.proposalTextarea) !== null;
  }

  /**
   * Listener para mensagens do popup (mantém compatibilidade)
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script recebeu mensagem:', request.action);

    switch (request.action) {
      case 'extractData':
        try {
          const data = extractProjectData();
          sendResponse({ success: true, data });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;

      case 'fillForm':
        try {
          fillProposalForm(request.data);
          sendResponse({ success: true, message: 'Formulário preenchido!' });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;

      case 'runAutomation':
        state.hasRun = false;
        state.isProcessing = false;
        runAutomation();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Ação desconhecida' });
    }

    return true;
  });

  // Inicialização
  console.log('99Freelas Proposal Assistant - Content Script carregado');

  // Executa automaticamente se estiver na página de projeto
  if (CONFIG.autoRun && isProjectPage()) {
    // Aguarda um pouco para garantir que a página está totalmente carregada
    setTimeout(() => {
      runAutomation();
    }, 1000);
  }
})();
