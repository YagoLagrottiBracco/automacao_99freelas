const express = require('express');
const router = express.Router();
const selectorsService = require('../services/selectors.service');

/**
 * GET /api/config/selectors
 * Retorna os seletores CSS atuais para a extensão
 */
router.get('/config/selectors', (req, res) => {
    try {
        const selectors = selectorsService.getSelectors();
        res.json({
            version: '1.0.0',
            selectors: selectors
        });
    } catch (error) {
        console.error('Erro ao buscar seletores:', error);
        res.status(500).json({ error: 'Erro interno ao buscar configurações' });
    }
});

module.exports = router;
