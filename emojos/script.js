const instanceUrl = 'https://bolha.one'; // Substitua pela URL da sua instância

let currentTabIndex = 0;
let sortedCategories = [];
let emojis = []; // Armazena todos os emojis carregados

let emojisByCategory = {}; // Declare a variável aqui para ser acessível em todo o escopo
let recentEmojis = []; // Array para armazenar emojis clicados

document.getElementById('load-button').onclick = fetchEmojis;

async function fetchEmojis() {
    const instanceUrl = document.getElementById('instance-url').value; // Obtém o valor da caixa de texto
    try {
        const response = await fetch(`${instanceUrl}/api/v1/custom_emojis`);
        if (!response.ok) {
            throw new Error('Erro ao buscar emojis');
        }
        const emojis = await response.json();
        displayEmojis(emojis);
        
        // Atualiza as informações sobre emojis e categorias
        document.getElementById('emoji-info').innerHTML = `
            Total de Emojis: ${emojis.length} • Total de Categorias: ${Object.keys(emojisByCategory).length}
        `;
    } catch (error) {
        console.error(error);
        document.getElementById('emoji-list').innerText = 'Erro ao carregar emojis.';
    }
}

function displayEmojis(emojis) {
    const emojiList = document.getElementById('emoji-list');
    emojiList.innerHTML = ''; // Limpa a lista antes de adicionar novos emojis

    // Agrupar emojis por categoria
    emojisByCategory = emojis.reduce((acc, emoji) => {
        const category = emoji.category || 'Sem Categoria'; // Define uma categoria padrão se não houver
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(emoji);
        return acc;
    }, {});

    // Organizar categorias em ordem alfabética
    sortedCategories = Object.keys(emojisByCategory).sort();

    // Criar um contêiner para os botões e as abas
    const navContainer = document.createElement('div');
    navContainer.className = 'nav-container';

    // Botão de voltar
    const backButton = document.createElement('button');
    backButton.innerHTML = '&larr;'; // Ícone de seta para a esquerda
    backButton.onclick = () => changeTab(-1);
    navContainer.appendChild(backButton);

    // Criar abas para cada categoria
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';

    // Adicionar abas
    sortedCategories.forEach((category, index) => {
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.innerHTML = `<img src="${emojisByCategory[category][0].url}" alt="${category}" /><br><small>${category}</small>`;
        
        // Adiciona evento de clique para mudar a lista de emojis
        tab.onclick = () => showCategory(category, emojisByCategory);
        
        tabContainer.appendChild(tab);
    });

// Botão de avançar
const nextButton = document.createElement('button');
nextButton.innerHTML = '&rarr;'; // Ícone de seta para a direita
nextButton.onclick = () => changeTab(1);
navContainer.appendChild(tabContainer);
navContainer.appendChild(nextButton);

emojiList.appendChild(navContainer);

// Adiciona o evento de scroll horizontal
navContainer.addEventListener('wheel', (event) => {
    event.preventDefault(); // Previne o scroll vertical da página
    tabContainer.scrollLeft += event.deltaY; // Ajusta o scroll horizontal com base no movimento do scroll vertical
});

    // Exibir a primeira categoria por padrão
    if (sortedCategories.length > 0) {
        showCategory(sortedCategories[0], emojisByCategory);
        tabContainer.children[1].style.display = 'block'; // Exibe a primeira aba
    }
}

function showCategory(category, emojisByCategory) {
    const emojiList = document.getElementById('emoji-list');
    const emojiDisplay = document.createElement('div');
    emojiDisplay.className = 'emoji-display';

    emojisByCategory[category].forEach(emoji => {
        const emojiDiv = document.createElement('div');
        emojiDiv.className = 'emoji';
        emojiDiv.innerHTML = `<img src="${emoji.url}" alt="${emoji.shortcode}" /><br><span class="emoji-text">:${emoji.shortcode}:</span>`;

        // Adiciona evento de clique para copiar o shortcode e atualizar a aba "Recentes"
        emojiDiv.onclick = () => handleEmojiClick(emoji, emojiDiv);

        emojiDisplay.appendChild(emojiDiv);
    });

    // Limpa a exibição anterior e adiciona a nova
    const existingDisplay = document.querySelector('.emoji-display');
    if (existingDisplay) {
        emojiList.removeChild(existingDisplay);
    }
    emojiList.appendChild(emojiDisplay);
}

function changeTab(direction) {
    const tabContainer = document.querySelector('.tab-container');
    const tabs = Array.from(tabContainer.getElementsByClassName('tab'));
    
    // Calcular a largura total das abas
    const tabWidth = tabs[0].offsetWidth; // Assume que todas as abas têm a mesma largura
    const scrollAmount = tabWidth * direction; // Define a quantidade de scroll

    // Faz o scroll da tabContainer
    tabContainer.scrollLeft += scrollAmount;
}

function handleEmojiClick(emoji, emojiDiv) {
    const shortcode = `:${emoji.shortcode}:`;
    navigator.clipboard.writeText(shortcode).then(() => {
        // Atualiza o texto do shortcode para "Copiado"
        emojiDiv.querySelector('.emoji-text').innerHTML = `<span style="color: red;">&#10003; Copiado</span>`;
        setTimeout(() => {
            emojiDiv.querySelector('.emoji-text').innerHTML = `:${emoji.shortcode}:`; // Retorna ao shortcode original após 5 segundos
        }, 1500); // Retorna ao shortcode original após 1.5 segundo

        // Adiciona o emoji à lista de recentes
        if (!recentEmojis.includes(emoji)) {
            recentEmojis.unshift(emoji); // Adiciona ao início do array
            updateRecentTab();
        }
    });
}

function updateRecentTab() {
    const recentCategory = "Recentes";
    const emojiList = document.getElementById('emoji-list');

    // Verifica se a aba "Recentes" já existe
    if (!sortedCategories.includes(recentCategory)) {
        sortedCategories.unshift(recentCategory); // Adiciona "Recentes" ao início da lista de categorias
        const tabContainer = document.querySelector('.tab-container');
        
        // Cria a nova aba
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.innerHTML = `<img src="${recentEmojis[0]?.url || ''}" alt="${recentCategory}" /><br><small>${recentCategory}</small>`;
        
        // Adiciona evento de clique para mostrar os emojis recentes
        tab.onclick = () => showRecentEmojis();
        tabContainer.prepend(tab); // Adiciona a aba "Recentes" no início
    }
    
    // Atualiza a aba "Recentes" com o último emoji clicado
    const recentTab = document.querySelector('.tab-container').firstChild; // A primeira aba é "Recentes"
    recentTab.innerHTML = `<img src="${recentEmojis[0]?.url || ''}" alt="${recentCategory}" /><br><small>${recentCategory}</small>`;
    changeTab(-1000);
}

function showRecentEmojis() {
    const emojiList = document.getElementById('emoji-list');
    const emojiDisplay = document.createElement('div');
    emojiDisplay.className = 'emoji-display';

    recentEmojis.forEach(emoji => {
        const emojiDiv = document.createElement('div');
        emojiDiv.className = 'emoji';
        emojiDiv.innerHTML = `<img src="${emoji.url}" alt="${emoji.shortcode}" /><br><span class="emoji-text">:${emoji.shortcode}:</span>`;

        // Adiciona evento de clique para copiar o shortcode
        emojiDiv.onclick = () => handleEmojiClick(emoji, emojiDiv);

    emojiDisplay.appendChild(emojiDiv);
    });

    // Limpa a exibição anterior e adiciona a nova
    const existingDisplay = document.querySelector('.emoji-display');
    if (existingDisplay) {
        emojiList.removeChild(existingDisplay);
    }
    emojiList.appendChild(emojiDisplay);
}

// Chama a função para buscar emojis ao carregar a página
fetchEmojis();

