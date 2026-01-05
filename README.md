# 🚀 99Freelas Proposal Assistant

Sistema de automação híbrida para criação de propostas no 99Freelas. Automatiza a análise de projetos e geração de propostas usando IA, respeitando as regras da plataforma.

## 📋 Visão Geral

Este sistema consiste em dois módulos:

1. **Extensão de Navegador** - Extrai dados do projeto e preenche formulários
2. **Backend Node.js** - Processa dados, aplica regras de negócio e gera propostas com IA

### ✨ Funcionalidades

- ✅ Extração automática de dados do projeto
- ✅ Análise de complexidade e viabilidade
- ✅ Cálculo inteligente de prazo e valor
- ✅ Geração de propostas personalizadas com IA
- ✅ Preenchimento automático do formulário
- ❌ **NÃO** envia proposta automaticamente (envio manual)
- ❌ **NÃO** automatiza login ou burla captcha

## 🏗️ Arquitetura

```
┌─────────────────┐     HTTP POST      ┌─────────────────┐
│   Extensão      │ ──────────────────►│    Backend      │
│   (Browser)     │                    │    (Node.js)    │
│                 │◄────────────────── │                 │
│  • Extrai DOM   │     JSON Response  │  • Regras       │
│  • Preenche     │                    │  • OpenAI API   │
└─────────────────┘                    └─────────────────┘
```

## 📁 Estrutura do Projeto

```
automation-99freelas/
│
├── extension/                 # Extensão de navegador
│   ├── manifest.json          # Configuração da extensão
│   ├── content.js             # Script de extração/preenchimento
│   ├── popup.html             # Interface do popup
│   ├── popup.js               # Lógica do popup
│   ├── styles.css             # Estilos do popup
│   └── icons/                 # Ícones da extensão
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
├── backend/                   # Backend Node.js
│   ├── src/
│   │   ├── server.js          # Servidor Express
│   │   ├── routes/
│   │   │   └── analyzeProject.js
│   │   ├── services/
│   │   │   ├── openai.service.js
│   │   │   ├── rules.engine.js
│   │   │   └── prompt.builder.js
│   │   └── utils/
│   │       └── classifier.js
│   ├── .env                   # Variáveis de ambiente
│   ├── .env.example           # Exemplo de configuração
│   └── package.json
│
└── README.md
```

## 🚀 Instalação

### 1. Backend

```bash
# Entre na pasta do backend
cd backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Edite o arquivo .env e adicione sua chave da OpenAI
# OPENAI_API_KEY=sk-sua-chave-aqui

# Inicie o servidor
npm start

# Ou em modo desenvolvimento (com hot reload)
npm run dev
```

O servidor iniciará em `http://localhost:3000`

### 2. Extensão de Navegador

#### Chrome

1. Abra `chrome://extensions/`
2. Ative o "Modo do desenvolvedor" no canto superior direito
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `extension`

#### Opera

1. Abra `opera://extensions/`
2. Ative o "Modo do desenvolvedor"
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `extension`

## 📖 Como Usar

1. **Faça login no 99Freelas** (manualmente, no seu navegador)

2. **Navegue até um projeto** que deseja analisar
   - URL exemplo: `https://www.99freelas.com.br/project/nome-do-projeto`

3. **Clique no ícone da extensão** na barra de ferramentas

4. **Clique em "Extrair Dados"** para ler as informações do projeto

5. **Clique em "Analisar Projeto"** para gerar a proposta com IA

6. **Revise o resultado**:
   - Complexidade
   - Viabilidade
   - Valor sugerido
   - Prazo sugerido
   - Texto da proposta

7. **Clique em "Preencher Proposta"** para preencher o formulário automaticamente

8. **Revise e envie manualmente** sua proposta

## ⚙️ Configuração

### Variáveis de Ambiente (Backend)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | 3000 |
| `OPENAI_API_KEY` | Chave da API OpenAI | - |
| `OPENAI_MODEL` | Modelo a usar | gpt-4o-mini |
| `NODE_ENV` | Ambiente | development |

### Regras de Negócio

O sistema aplica as seguintes regras automaticamente:

#### Recomendações de Stack

| Stack Detectada | Recomendação |
|-----------------|--------------|
| WordPress | Elementor Pro + Yoast Pro |
| Sem stack | React + Node.js |
| PHP | Perguntar sobre migração |
| JS | Respeitar stack escolhida |

#### Cálculo de Prazo

- Base: +10% a +20% do prazo informado
- JavaScript: +50% adicional
- PHP: +25% adicional
- Complexo: +20% a +40% adicional

#### Cálculo de Valor

- Base: -5% a -10% do orçamento informado
- Médio: máximo -10%
- Complexo: máximo -5%

## 🧪 Testando

### Testar o Backend

```bash
# Health check
curl http://localhost:3000/health

# Teste de análise
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCliente": "João",
    "tituloProjeto": "Criar landing page",
    "descricaoProjeto": "Preciso de uma landing page em WordPress para minha empresa",
    "stackMencionada": "WordPress",
    "orcamentoInformado": 1000,
    "prazoInformado": 15
  }'
```

### Resposta Esperada

```json
{
  "textoProposta": "{i}{b}Olá{/b}, {u}João{/u}, tudo bem? Espero que sim!{/i}...",
  "prazo": 18,
  "valor": 925,
  "complexidade": "simples",
  "viabilidade": "viável"
}
```

## 📝 Template da Proposta

O texto da proposta segue um template fixo. Apenas `#NOMEDOCLIENTE` e `#TEXTODEEXPLICAÇÃO` são alterados:

```
{i}{b}Olá{/b}, {u}#NOMEDOCLIENTE{/u}, tudo bem? Espero que sim!{/i}

{code}
#TEXTODEEXPLICAÇÃO
{/code}

{pre}
Sou freelancer em tempo integral...
...
{/pre}
```

## ⚠️ Avisos Importantes

1. **Este sistema NÃO viola as regras do 99Freelas**
   - Não automatiza login
   - Não burla captcha
   - Não envia propostas automaticamente
   - Funciona apenas como assistente

2. **Requer ação manual do usuário**
   - O envio da proposta é sempre manual
   - O usuário deve revisar antes de enviar

3. **Custos com OpenAI**
   - A geração de propostas usa a API da OpenAI
   - Verifique seus créditos e limites

## 🔒 Segurança

- A chave da API OpenAI é armazenada apenas localmente no arquivo `.env`
- Nenhum dado é enviado para servidores terceiros (apenas OpenAI)
- A extensão só funciona em páginas do 99freelas

## 📄 Licença

MIT License - Desenvolvido por [Lagrotti](https://lagrotti.dev)

## 🐛 Problemas Conhecidos

- Os seletores CSS podem precisar de atualização caso o 99freelas mude o layout
- Em caso de erro de extração, tente recarregar a página

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra uma issue ou pull request.
