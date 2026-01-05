
const express = require('express');
const router = express.Router();
const { createCheckoutSession } = require('../services/payments.service');
const authMiddleware = require('../middlewares/auth.middleware');
const supabase = require('../services/supabase.client');

/**
 * POST /api/create-checkout-session
 * Cria uma sessão de pagamento para o plano mensal
 */
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
    try {
        const user = req.user; // Vem do authMiddleware
        const { priceId } = req.body; // Opcional se só tiver um plano, mas bom pra flexibilidade

        // Pega ou cria o customer no Stripe (simplificado por enquanto)
        // Idealmente salvaríamos o stripe_customer_id na tabela users/profiles

        // ID do Preço no Stripe (Adicionar ao .env)
        const TARGET_PRICE_ID = priceId || process.env.STRIPE_PRICE_ID;

        if (!TARGET_PRICE_ID) {
            return res.status(500).json({ error: 'ID do preço não configurado no servidor' });
        }

        const session = await createCheckoutSession(
            null, // customerId (implementar depois se quiser reutilizar cliente)
            TARGET_PRICE_ID,
            'https://www.99freelas.com.br/success?session_id={CHECKOUT_SESSION_ID}', // URL Sucesso (placeholder)
            'https://www.99freelas.com.br/cancel', // URL Cancelamento (placeholder)
            user.id // Client Reference ID (UUID do Supabase) para o Webhook saber quem pagou
        );

        res.json({ url: session.url });
    } catch (error) {
        console.error('Erro ao criar checkout:', error);
        res.status(500).json({ error: 'Erro ao processar pagamento' });
    }
});

module.exports = router;
