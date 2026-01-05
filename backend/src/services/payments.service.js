
const Stripe = require('stripe');

// Inicializa o Stripe com a chave secreta do .env
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  Stripe Secret Key not found in .env. Payment features will not work until configured.');
}

/**
 * Cria uma sessão de checkout para assinatura
 * @param {string} customerId - ID do cliente no Stripe (se existir)
 * @param {string} priceId - ID do preço do plano (ex: price_123...)
 * @param {string} successUrl - URL de redirecionamento após sucesso
 * @param {string} cancelUrl - URL de redirecionamento após cancelamento
 * @param {string} clientReferenceId - ID do usuário no nosso sistema para webhook
 */
async function createCheckoutSession(customerId, priceId, successUrl, cancelUrl, clientReferenceId) {
    try {
        const sessionConfig = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: clientReferenceId,
        };

        // Se tivermos o ID do cliente Stripe, usamos para evitar duplicidade
        if (customerId) {
            sessionConfig.customer = customerId;
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);
        return session;
    } catch (error) {
        console.error('Erro ao criar sessão de checkout:', error);
        throw error;
    }
}

/**
 * Verifica se uma assinatura está ativa
 * @param {string} subscriptionId 
 */
async function getSubscriptionStatus(subscriptionId) {
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        return subscription.status; // 'active', 'past_due', 'canceled', etc.
    } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
        throw error;
    }
}

module.exports = {
    stripe,
    createCheckoutSession,
    getSubscriptionStatus
};
