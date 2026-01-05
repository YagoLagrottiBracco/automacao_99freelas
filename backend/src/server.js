/**
 * Server - 99Freelas Backend
 * 
 * Servidor Express para processamento de propostas com IA
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const analyzeProjectRoute = require('./routes/analyzeProject');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
    origin: [
        'chrome-extension://*',
        'moz-extension://*',
        'http://localhost:*'
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Rotas
app.use('/api', analyzeProjectRoute);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Error handler global
app.use((err, req, res, next) => {
    console.error('Erro:', err);

    res.status(err.status || 500).json({
        error: err.message || 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Inicialização
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 99Freelas Backend iniciado!');
    console.log(`📡 Servidor rodando em http://localhost:${PORT}`);
    console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 Modelo OpenAI: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
    console.log('='.repeat(50));
});

module.exports = app;
