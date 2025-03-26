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
            <img class="product-image" src="${product.imageUrl}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <div class="product-rating">
                    <span>${product.rating}</span>
                    <span>(${product.reviewCount} reviews)</span>
                </div>
                <a href="${product.productUrl}" class="product-link" target="_blank">View on Amazon</a>
            </div>
        </div>
    `;
}

// Função para buscar produtos
async function searchProducts(keyword) {
    try {
        showError('');
        toggleLoading(true);
        const response = await fetch(`http://localhost:3000/scrape?keyword=${encodeURIComponent(keyword)}`);
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to fetch products');
        }

        const products = await response.json();
        resultsElement.innerHTML = products.map(createProductCard).join('');
    } catch (error) {
        showError(error.message);
    } finally {
        toggleLoading(false);
    }
}

// Event Listeners
searchButton.addEventListener('click', () => {
    const keyword = searchInput.value.trim();
    if (keyword) {
        searchProducts(keyword);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const keyword = searchInput.value.trim();
        if (keyword) {
            searchProducts(keyword);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');

    const showLoading = () => {
        loadingDiv.classList.remove('hidden');
        errorDiv.classList.add('hidden');
        resultsDiv.innerHTML = '';
    };

    const hideLoading = () => {
        loadingDiv.classList.add('hidden');
    };

    const showError = (message) => {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    };

    const createProductCard = (product) => {
        return `
            <div class="product-card">
                <img class="product-image" src="${product.imageUrl}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-rating">
                        <span>${product.rating}</span>
                        <span>(${product.reviewCount} reviews)</span>
                    </div>
                    <a href="${product.productUrl}" class="product-link" target="_blank">View on Amazon</a>
                </div>
            </div>
        `;
    };

    const searchProducts = async (keyword) => {
        try {
            showLoading();
            const response = await fetch(`http://localhost:3000/scrape?keyword=${encodeURIComponent(keyword)}`);
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to fetch products');
            }

            const products = await response.json();
            resultsDiv.innerHTML = products.map(createProductCard).join('');
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    };

    searchButton.addEventListener('click', () => {
        const keyword = searchInput.value.trim();
        if (keyword) {
            searchProducts(keyword);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const keyword = searchInput.value.trim();
            if (keyword) {
                searchProducts(keyword);
            }
        }
    });
}); 