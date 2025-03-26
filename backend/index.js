import express from 'express';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import cors from 'cors';

const app = express();
const port = 3000;

// Configuração do CORS
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Headers para simular um navegador real
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
};

// Função para extrair dados do produto
function extractProductData(element) {
  try {
    // Seletores para encontrar os elementos
    const titleElement = element.querySelector('h2 a span');
    const ratingElement = element.querySelector('.a-icon-star-small');
    const reviewCountElement = element.querySelector('.s-link-style .s-underline-text');
    const imageElement = element.querySelector('.s-image');
    const linkElement = element.querySelector('h2 a');

    if (!titleElement || !imageElement || !linkElement) {
      return null;
    }

    return {
      title: titleElement.textContent?.trim() || '',
      rating: ratingElement?.textContent?.trim() || 'Sem avaliação',
      reviewCount: reviewCountElement?.textContent?.trim() || '0',
      imageUrl: imageElement.getAttribute('src') || '',
      productUrl: `https://www.amazon.com${linkElement.getAttribute('href')}`,
    };
  } catch (error) {
    console.error('Erro ao extrair dados do produto:', error);
    return null;
  }
}

// Endpoint principal de scraping
app.get('/scrape', async (req, res) => {
  try {
    const { keyword } = req.query;
    console.log('Recebida requisição para keyword:', keyword);

    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: 'Palavra-chave inválida' });
    }

    // Faz a requisição para a Amazon
    console.log('Fazendo requisição para Amazon...');
    const response = await axios.get(`https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`, {
      headers,
      timeout: 15000,
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Aceita qualquer status menor que 500
      }
    });

    // Verifica se a resposta contém HTML válido
    if (!response.data || typeof response.data !== 'string') {
      throw new Error('Resposta inválida da Amazon');
    }

    // Cria um DOM virtual com o HTML recebido
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    // Verifica se fomos bloqueados
    const blockedText = document.querySelector('body').textContent;
    if (blockedText.includes('Sorry, we just need to make sure you\'re not a robot') ||
        blockedText.includes('To discuss automated access to Amazon data please contact') ||
        blockedText.includes('Enter the characters you see below')) {
      throw new Error('Acesso bloqueado pela Amazon. Tente novamente mais tarde.');
    }

    // Encontra todos os produtos na página
    const productElements = document.querySelectorAll('.s-result-item[data-component-type="s-search-result"]');
    console.log(`Encontrados ${productElements.length} produtos`);
    
    // Extrai os dados dos 10 primeiros produtos
    const products = [];
    for (const element of productElements) {
      const productData = extractProductData(element);
      if (productData) {
        products.push(productData);
        if (products.length >= 10) break;
      }
    }

    if (products.length === 0) {
      return res.status(404).json({ error: 'Nenhum produto encontrado' });
    }

    console.log(`Retornando ${products.length} produtos`);
    res.json(products);
  } catch (error) {
    console.error('Erro durante o scraping:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('Status do erro:', error.response?.status);
      console.error('Dados do erro:', error.response?.data);
      
      if (error.response?.status === 503) {
        return res.status(503).json({ error: 'Acesso bloqueado pela Amazon. Tente novamente mais tarde.' });
      }
    }
    
    res.status(500).json({ error: error.message || 'Erro ao buscar produtos. Tente novamente mais tarde.' });
  }
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log('CORS configurado para:', 'http://localhost:5173');
}); 