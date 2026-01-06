const express = require('express');
const router = express.Router();

/**
 * GET /privacy-policy
 * Rota pública para exibir a política de privacidade
 */
router.get('/privacy-policy', (req, res) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Política de Privacidade - 99Freelas Extension</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
            h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            h2 { color: #34495e; margin-top: 30px; }
            p { margin-bottom: 15px; }
            ul { margin-bottom: 15px; }
            .last-updated { color: #7f8c8d; font-size: 0.9em; margin-top: 50px; font-style: italic; }
        </style>
    </head>
    <body>
        <h1>Política de Privacidade</h1>
        
        <p>A sua privacidade é importante para nós. É política do 99Freelas Extension respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site <a href="https://automacao-99freelas.onrender.com">99Freelas Extension</a>, e outros sites que possuímos e operamos.</p>
        
        <h2>1. Informações que Coletamos</h2>
        <p>Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.</p>
        
        <h2>2. Uso das Informações</h2>
        <p>Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.</p>
        
        <h2>3. Compartilhamento de Dados</h2>
        <p>Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.</p>
        
        <h2>4. Cookies</h2>
        <p>O nosso site pode usar cookies para melhorar a experiência do usuário. Você tem a liberdade de recusar a nossa solicitação de informações pessoais, entendendo que talvez não possamos fornecer alguns dos serviços desejados.</p>
        
        <h2>5. Compromisso do Usuário</h2>
        <p>O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o 99Freelas Extension oferece no site e com caráter enunciativo, mas não limitativo:</p>
        <ul>
            <li>A) Não se envolver em atividades que sejam ilegais ou contrárias à boa fé a à ordem pública;</li>
            <li>B) Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;</li>
            <li>C) Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do 99Freelas Extension, de seus fornecedores ou terceiros, para introduzir ou disseminar vírus informáticos ou quaisquer outros sistemas de hardware ou software que sejam capazes de causar danos anteriormente mencionados.</li>
        </ul>

        <h2>6. Mais Informações</h2>
        <p>Esperemos que esteja esclarecido e, como mencionado anteriormente, se houver algo que você não tem certeza se precisa ou não, geralmente é mais seguro deixar os cookies ativados, caso interaja com um dos recursos que você usa em nosso site.</p>

        <p class="last-updated">Esta política é efetiva a partir de Janeiro/2026.</p>
    </body>
    </html>
    `;

    res.send(htmlContent);
});

module.exports = router;
