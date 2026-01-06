
const supabase = require('./supabase.client');

const TRIAL_LIMIT = 10;

/**
 * Verifica se o usuário pode gerar uma proposta
 * @param {string} userId - ID do usuário
 * @returns {Promise<{allowed: boolean, reason: string, remaining?: number}>}
 */
async function checkAccess(userId) {
    // 1. Verificar se tem assinatura ativa
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .single();

    if (subscription) {
        return { allowed: true, reason: 'subscription' };
    }

    // 2. Se não tiver assinatura, verificar contagem de uso (Trial)
    const { count, error } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) {
        console.error('Erro ao contar uso:', error);
        // Em caso de erro, bloqueia por segurança ou libera? 
        // Vamos liberar com log de erro para não travar o usuário por falha nossa
        return { allowed: true, reason: 'error_bypass' };
    }

    if (count < TRIAL_LIMIT) {
        return {
            allowed: true,
            reason: 'trial',
            remaining: TRIAL_LIMIT - count
        };
    }

    return {
        allowed: false,
        reason: 'limit_reached',
        limit: TRIAL_LIMIT
    };
}

/**
 * Registra o uso de uma geração
 * @param {string} userId 
 * @param {Object} projectData 
 * @param {Object} proposalResult 
 */
async function logUsage(userId, projectData, proposalResult) {
    // Extrai dados seguros para log
    const {
        tituloProjeto,
        urlProjeto
    } = projectData;

    const {
        textoProposta,
        valor,
        prazo
    } = proposalResult || {};

    const { error } = await supabase
        .from('usage_logs')
        .insert({
            user_id: userId,
            project_title: tituloProjeto,
            project_url: urlProjeto,
            proposal_text: textoProposta,
            proposal_value: valor,
            proposal_deadline: prazo
        });

    if (error) {
        console.error('Erro ao registrar uso:', error);
    }
}

module.exports = {
    checkAccess,
    logUsage,
    TRIAL_LIMIT
};
