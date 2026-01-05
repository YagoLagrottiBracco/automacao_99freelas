
const supabase = require('../services/supabase.client');

/**
 * Middleware de Autenticação
 * Verifica se o request possui um token JWT válido do Supabase
 */
const authMiddleware = async (req, res, next) => {
    // Permite bypass em desenvolvimento se configurado
    if (process.env.SKIP_AUTH === 'true') {
        req.user = { id: 'dev-user', email: 'dev@local.com' };
        return next();
    }

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Token de autenticação não fornecido' });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verifica o token usando o cliente do Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('Erro de Auth:', error?.message);
            return res.status(403).json({ error: 'Token inválido ou expirado' });
        }

        // Anexa o usuário ao request
        req.user = user;

        // AIDA NÃO VERIFICAMOS O PAGAMENTO AQUI
        // Isso será feito pelo payments.middleware.js que vamos criar

        next();
    } catch (err) {
        console.error('Erro interno de Auth:', err);
        return res.status(500).json({ error: 'Erro ao processar autenticação' });
    }
};

module.exports = authMiddleware;
