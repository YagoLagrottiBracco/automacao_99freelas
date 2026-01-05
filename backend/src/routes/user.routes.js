
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const accessService = require('../services/access.service');
const supabase = require('../services/supabase.client');

/**
 * GET /api/me
 * Retorna dados do usuário logado, incluindo status da assinatura e uso do trial.
 */
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const email = req.user.email;

        // Verifica status de acesso
        const accessParams = await accessService.checkAccess(userId);

        // Busca dados adicionais se necessário (ex: nome)
        // const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

        res.json({
            id: userId,
            email: email,
            status: accessParams.reason === 'subscription' ? 'premium' : (accessParams.allowed ? 'trial' : 'expired'),
            trial_remaining: accessParams.remaining,
            trial_limit: accessService.TRIAL_LIMIT
        });

    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }
});

module.exports = router;
