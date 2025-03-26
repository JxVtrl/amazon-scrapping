import express from 'express';
import { JSDOM } from 'jsdom';
import cors from 'cors';
import puppeteer from 'puppeteer';

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
      console.log('Elementos não encontrados no produto:', {
        title: !!titleElement,
        image: !!imageElement,
        link: !!linkElement
      });
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

// Função para fazer scraping com Puppeteer
async function scrapeWithPuppeteer(keyword) {
  console.log('Iniciando navegador Puppeteer...');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    console.log('Criando nova página...');
    const page = await browser.newPage();
    
    // Configurar user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Configurar viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Configurar idioma
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    });

    console.log('Navegando para a Amazon...');
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Aguardando carregamento dos produtos...');
    await page.waitForSelector('.s-result-item[data-component-type="s-search-result"]', {
      timeout: 10000
    });

    console.log('Obtendo conteúdo da página...');
    const content = await page.content();
    
    return content;
  } finally {
    console.log('Fechando navegador...');
    await browser.close();
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

    // Faz o scraping usando Puppeteer
    const html = await scrapeWithPuppeteer(keyword);
    
    // Cria um DOM virtual com o HTML recebido
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Log do HTML recebido
    console.log('HTML recebido:', html.substring(0, 500));

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
    res.status(500).json({ error: error.message });
  }
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: err.message });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log('CORS configurado para:', 'http://localhost:5173');
}); 