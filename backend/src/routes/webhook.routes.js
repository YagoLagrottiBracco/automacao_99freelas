
const express = require('express');
const router = express.Router();
const { stripe } = require('../services/payments.service');
const supabase = require('../services/supabase.client');

// Webhook precisa do body raw, então configuramos isso no server.js depois
// Por enquanto, assumimos que o parser está certo ou usamos express.raw() aqui se montado separadamente

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Valida se o evento vem mesmo do Stripe
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Processa eventos relevantes
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.client_reference_id;
                const customerId = session.customer;
                const subscriptionId = session.subscription;

                // Salva/Atualiza na tabela subscriptions
                if (userId) {
                    await supabase.from('subscriptions').upsert({
                        user_id: userId,
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        status: 'active',
                        updated_at: new Date()
                    });
                    console.log(`✅ Assinatura criada para user ${userId}`);
                }
                break;
            }

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const status = subscription.status;
                const customerId = subscription.customer;

                // Atualiza status no banco
                // Precisamos achar o user pelo customer_id se não tivermos ref direta aqui
                const { data: subs } = await supabase
                    .from('subscriptions')
                    .select('user_id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (subs && subs.user_id) {
                    await supabase.from('subscriptions').update({
                        status: status,
                        updated_at: new Date()
                    }).eq('user_id', subs.user_id);
                    console.log(`🔄 Assinatura atualizada para user ${subs.user_id}: ${status}`);
                }
                break;
            }
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Erro ao processar evento:', err);
        res.status(500).json({ error: 'Processing error' });
    }
});

module.exports = router;
