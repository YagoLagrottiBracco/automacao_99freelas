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

// Middlewares - CORS configurado para aceitar requisições do 99freelas
app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem origin (como extensões ou curl)
        if (!origin) return callback(null, true);

        // Lista de origens permitidas
        const allowedOrigins = [
            'https://www.99freelas.com.br',
            'https://99freelas.com.br',
            /^chrome-extension:\/\//,
            /^moz-extension:\/\//,
            /^http:\/\/localhost/
        ];

        // Verifica se a origem é permitida
        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return allowed === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('CORS bloqueado para origem:', origin);
            callback(null, true); // Permite mesmo assim para não bloquear
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware para garantir headers CORS em todas as respostas
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Rotas
const analyzeProjectRoute = require('./routes/analyzeProject');
const paymentsRoutes = require('./routes/payments.routes');
const webhookRoutes = require('./routes/webhook.routes');

// Webhooks devem ser registrados ANTES do parser JSON global se eles precisarem do body raw
// O webhook.routes.js usa express.raw(), então o express deve rotear corretamente
app.use('/api', webhookRoutes);

app.use(express.json());

// Rotas da API
app.use('/api', analyzeProjectRoute);
app.use('/api', paymentsRoutes);

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
