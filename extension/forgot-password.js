
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa Supabase
    if (!window.supabase) {
        showMessage('Erro: Biblioteca Supabase não carregada.', 'error');
        return;
    }

    // Pega configurações
    const config = window.SUPABASE_CONFIG || {
        SUPABASE_URL: window.SUPABASE_URL,
        SUPABASE_ANON_KEY: window.SUPABASE_ANON_KEY
    };

    // Adapter (necessário mesmo se não usar auth persistente explicitamente aqui, o client pede)
    const storageAdapter = (config.ChromeStorageAdapter) ? config.ChromeStorageAdapter : {
        getItem: (key) => new Promise(res => chrome.storage.local.get([key], r => res(r[key]))),
        setItem: (key, val) => new Promise(res => chrome.storage.local.set({ [key]: val }, res)),
        removeItem: (key) => new Promise(res => chrome.storage.local.remove(key, res)),
    };

    const _supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        auth: {
            storage: storageAdapter,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
        }
    });

    const form = document.getElementById('forgot-form');
    const emailInput = document.getElementById('email');
    const btnSubmit = document.getElementById('btn-submit');
    const btnText = document.getElementById('btn-text');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoading(true);

        const email = emailInput.value;

        try {
            const { error } = await _supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'https://www.99freelas.com.br/reset-password' // Idealmente uma página sua, mas isso funciona como placeholder
            });

            if (error) throw error;

            showMessage('Link enviado! Verifique seu e-mail.', 'success');
            form.reset();

        } catch (error) {
            console.error('Password reset error:', error);
            showMessage(error.message || 'Erro ao enviar e-mail', 'error');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        btnSubmit.disabled = isLoading;
        if (isLoading) {
            btnText.style.display = 'none';
            if (!btnSubmit.querySelector('.spinner')) {
                const spinner = document.createElement('span');
                spinner.className = 'spinner';
                btnSubmit.prepend(spinner);
            }
        } else {
            btnText.style.display = 'inline';
            const spinner = btnSubmit.querySelector('.spinner');
            if (spinner) spinner.remove();
        }
    }

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }
});
