const CACHE_NAME = 'quiz-educlass-v1.0'; // Nome e versão do cache. Altere a versão para forçar atualização do cache.
const urlsToCache = [
  '/', // A raiz do seu site (geralmente index.html)
  '/index.html',
  '/manifest.json',
  // IMAGENS (se local, como o seu logo e fundo)
  '/images/logo.jpg', // Seu logotipo
  '/images/fundo.jpg', // Sua imagem de fundo
  // ÍCONES DO PWA (criados no Passo 1)
  '/images/icon-48x48.png',
  '/images/icon-72x72.png',
  '/images/icon-96x96.png',
  '/images/icon-144x144.png',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  // ÁUDIOS (se você baixou eles e os colocou localmente)
  // Recomendo baixar os sons e colocá-los em uma pasta 'audio' dentro de 'images'
  // Ex: 'images/audio/correct.mp3', 'images/audio/wrong.mp3'
  // Se você os deixar como URLs externos, eles NÃO estarão em cache para offline.
  // '/audio/correct.mp3', // Exemplo: se você salvar o som localmente
  // '/audio/wrong.mp3',   // Exemplo: se você salvar o som localmente
  // Se o Tailwind CSS for baixado e não usado via CDN (muito recomendado para PWA)
  // '/css/tailwind.min.css', // Exemplo de caminho local para o arquivo Tailwind
  // Se tiver outros arquivos JS ou XMLs padrão que deseja que funcionem offline
  // '/seus-dados.xml', // Exemplo: se você tiver um XML padrão com perguntas
  // '/historico.xml', // Exemplo: se quiser ter um histórico padrão em cache
];

// --- Instalação do Service Worker ---
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache aberto durante a instalação.');
        return cache.addAll(urlsToCache); // Adiciona todos os recursos à lista de cache
      })
      .then(() => {
        console.log('Service Worker: Todos os recursos foram cacheados.');
        return self.skipWaiting(); // Força o novo Service Worker a se ativar imediatamente
      })
      .catch(error => {
        console.error('Service Worker: Falha ao cachear durante a instalação:', error);
      })
  );
});

// --- Intercepta requisições de rede (Fetch) ---
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request) // Tenta encontrar a requisição no cache
      .then(response => {
        // Se o recurso está no cache, o retorna
        if (response) {
          return response;
        }
        // Caso contrário, busca o recurso na rede
        return fetch(event.request);
      })
      .catch(() => {
        // Se a requisição falhar (ex: offline e não está em cache)
        // Você pode retornar uma página offline aqui, se desejar
        // Ex: return caches.match('/offline.html');
        console.log('Service Worker: Requisição de rede falhou e recurso não está em cache.', event.request.url);
        // Para este quiz, apenas falharemos silenciosamente ou retornaremos um erro
        return new Response('Você está offline e este recurso não está disponível offline.');
      })
  );
});

// --- Ativação do Service Worker ---
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]; // Apenas o cache com o nome atual deve ser mantido
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Deleta caches que não estão na lista branca (caches antigos)
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Ativado. Limpeza de caches antigos concluída.');
      return self.clients.claim(); // Permite que o Service Worker controle os clientes imediatamente
    })
  );
});