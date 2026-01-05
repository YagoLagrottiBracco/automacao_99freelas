
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa Supabase
    // Assume que SUPABASE_URL e SUPABASE_ANON_KEY vêm do config.js
    if (!window.supabase) {
        console.error('Supabase library not loaded');
        showMessage('Erro: Biblioteca Supabase não carregada.', 'error');
        return;
    }

    if (!SUPABASE_URL || SUPABASE_URL === 'PLACEHOLDER_URL') {
        showMessage('Erro de Configuração: Adicione as chaves no config.js', 'error');
        return;
    }

    const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            storage: chrome.storage.local, // Usa storage do Chrome para persistir sessão
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
        }
    });

    // Elementos
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const btnLogin = document.getElementById('btn-login');
    const btnText = document.getElementById('btn-text');
    const messageDiv = document.getElementById('message');

    // Handler de Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoading(true);

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const { data, error } = await _supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            console.log('Login realizado:', data);
            showMessage('Login realizado com sucesso!', 'success');

            // Salva token e user info explicitamente (embora Supabase já salve)
            // para facilitar acesso em outras partes síncronas se precisar
            await chrome.storage.local.set({
                session: data.session,
                user: data.user
            });

            // Redireciona ou fecha (depende de onde foi aberto)
            setTimeout(() => {
                // Se estiver num popup, pode fechar ou ir para main
                // Se estiver em aba completa, fecha a aba
                window.close();
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);
            showMessage(error.message || 'Erro ao realizar login', 'error');
        } finally {
            setLoading(false);
        }
    });

    // Helper functions
    function setLoading(isLoading) {
        btnLogin.disabled = isLoading;
        if (isLoading) {
            btnText.style.display = 'none';
            // Adiciona spinner se não tiver
            if (!btnLogin.querySelector('.spinner')) {
                const spinner = document.createElement('span');
                spinner.className = 'spinner';
                btnLogin.prepend(spinner);
            }
        } else {
            btnText.style.display = 'inline';
            const spinner = btnLogin.querySelector('.spinner');
            if (spinner) spinner.remove();
        }
    }

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }
});
