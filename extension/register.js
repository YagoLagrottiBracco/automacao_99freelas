
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa Supabase
    if (!window.supabase) {
        showMessage('Erro: Biblioteca Supabase não carregada.', 'error');
        return;
    }

    // Pega configurações e adapter do config.js
    const config = window.SUPABASE_CONFIG || {
        SUPABASE_URL: window.SUPABASE_URL,
        SUPABASE_ANON_KEY: window.SUPABASE_ANON_KEY
    };

    // Adapter inline se não vier do config
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

    const form = document.getElementById('register-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const btnRegister = document.getElementById('btn-register');
    const btnText = document.getElementById('btn-text');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoading(true);

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const { data, error } = await _supabase.auth.signUp({
                email,
                password
            });

            if (error) throw error;

            console.log('Cadastro realizado:', data);

            // Verifica se precisa de confirmar email
            if (data.user && !data.session) {
                showMessage('Verifique seu e-mail para confirmar o cadastro.', 'success');
            } else {
                showMessage('Cadastro realizado! Redirecionando...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }

        } catch (error) {
            console.error('Registration error:', error);
            showMessage(error.message || 'Erro ao realizar cadastro', 'error');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        btnRegister.disabled = isLoading;
        if (isLoading) {
            btnText.style.display = 'none';
            if (!btnRegister.querySelector('.spinner')) {
                const spinner = document.createElement('span');
                spinner.className = 'spinner';
                btnRegister.prepend(spinner);
            }
        } else {
            btnText.style.display = 'inline';
            const spinner = btnRegister.querySelector('.spinner');
            if (spinner) spinner.remove();
        }
    }

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }
});
