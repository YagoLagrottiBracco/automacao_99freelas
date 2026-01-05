
// Evento de instalação ou atualização da extensão
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Abre a tela de login ao instalar
        chrome.tabs.create({
            url: chrome.runtime.getURL('login.html')
        });
    }
});
