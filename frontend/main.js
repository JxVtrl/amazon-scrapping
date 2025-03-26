// Elementos do DOM
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const resultsElement = document.getElementById('results');

// Função para mostrar/ocultar loading
function toggleLoading(show) {
    loadingElement.classList.toggle('hidden', !show);
}

// Função para mostrar erro
function showError(message) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    resultsElement.innerHTML = '';
}

// Função para criar card de produto
function createProductCard(product) {
    return `
        <div class="product-card">
            <img src="${product.imageUrl}" alt="${product.title}" class="product-image">
            <div class="product-info">
                <a href="${product.productUrl}" target="_blank" class="product-title">
                    ${product.title}
                </a>
                <div class="product-rating">${product.rating}</div>
                <div class="product-reviews">${product.reviewCount} avaliações</div>
            </div>
        </div>
    `;
}

// Função para buscar produtos
async function searchProducts() {
    const keyword = searchInput.value.trim();
    
    if (!keyword) {
        showError('Por favor, digite um termo para busca');
        return;
    }

    // Limpa resultados anteriores
    errorElement.classList.add('hidden');
    resultsElement.innerHTML = '';
    toggleLoading(true);

    try {
        console.log('Fazendo requisição para buscar produtos...');
        const response = await fetch(`http://localhost:3000/scrape?keyword=${encodeURIComponent(keyword)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao buscar produtos');
        }

        console.log('Produtos encontrados:', data.length);

        if (data.length === 0) {
            showError('Nenhum produto encontrado');
            return;
        }

        // Exibe os resultados
        resultsElement.innerHTML = data.map(createProductCard).join('');
        errorElement.classList.add('hidden');
    } catch (error) {
        console.error('Erro na busca:', error);
        showError(error.message);
    } finally {
        toggleLoading(false);
    }
}

// Event Listeners
searchButton.addEventListener('click', searchProducts);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchProducts();
    }
}); 