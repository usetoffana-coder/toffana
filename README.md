# DrakFeet V3 - Catálogo Público

## Visão Geral
Este projeto entrega o catálogo público do DrakFeet V3 com layout premium, tema claro/escuro, vitrines, carrinho e integração total com o painel Admin (Firestore). O catálogo lê configurações, banners, produtos e redes sociais diretamente do Firestore.

## Estrutura Principal
- `public/index.html`: Home do catálogo com todas as seções.
- `public/assets/css/style.css`: Design system, variáveis de tema e responsividade.
- `public/assets/js/app.js`: Lógica principal do catálogo.
- `public/assets/js/services/*`: Serviços para Firestore, tema, carrinho, tracking.
- `admin/configuracoes/banners.html`: Admin para banners (slider e categoria).
- `admin/assets/js/pages/config-banners.page.js`: Lógica do admin de banners.
- `firestore.rules`: Regras do Firestore para acesso público e admin.

## Requisitos
- Conta Firebase
- Projeto Firestore
- Conta Cloudinary
- Node opcional (apenas se você quiser usar bundlers, mas o projeto é vanilla)

---
# 1) Configurar Cloudinary (upload de imagens)

1. Crie conta em https://cloudinary.com/
2. Acesse o Dashboard e copie o **Cloud name**.
3. Vá em **Settings → Upload → Upload presets**.
4. Clique em **Add upload preset**:
   - Defina como **Unsigned**.
   - Salve o preset.
5. No Admin, atualize `admin/assets/js/core/config.js`:

```js
cloudinary: {
  cloudName: 'SEU_CLOUD_NAME',
  uploadPreset: 'SEU_UPLOAD_PRESET'
}
```

---
# 2) Configurar Firebase

## 2.1 Criar projeto
1. Acesse https://console.firebase.google.com/
2. Clique em **Add project**.
3. Conclua o assistente.

## 2.2 Criar app Web
1. Dentro do projeto, clique no ícone `</>` para criar **Web App**.
2. Copie o snippet de configuração (apiKey, authDomain, etc).
3. Preencha:
   - `admin/assets/js/core/config.js`
   - `public/assets/js/firebase.config.js`

## 2.3 Ativar Authentication
1. Em **Authentication → Sign-in method**
2. Ative **Email/Password**.
3. Crie pelo menos 1 usuário admin no painel do Firebase.

## 2.4 Criar Firestore
1. Em **Firestore Database** clique em **Create database**.
2. Use modo **Production**.
3. Selecione a região desejada.

---
# 3) Regras do Firestore

O projeto já inclui as regras em `firestore.rules`. Publique-as no Firebase:

1. Vá em **Firestore Database → Rules**
2. Cole o conteúdo de `firestore.rules`.
3. Clique em **Publish**.

Essas regras permitem:
- Leitura pública de catálogo (produtos ativos, banners ativos, redes sociais, menu links).
- Escrita pública apenas em métricas.
- Escrita protegida para admin/editor no restante.

---
# 4) Índices necessários

Algumas consultas usam `where` + `orderBy`. Crie estes índices no Firestore:

- Collection: `banners`
  - Fields: `ativo` (Ascending), `ordem` (Ascending)

- Collection: `menu_links`
  - Fields: `ativo` (Ascending), `ordem` (Ascending)

- Collection: `redes_sociais`
  - Fields: `ativo` (Ascending), `ordem` (Ascending)

> O console do Firebase indica automaticamente quando um índice é necessário.

---
# 5) Estrutura dos dados no Firestore (todas as coleções do sistema)

## 5.1 Core (necessárias para o catálogo + admin)
- `config/loja`: configurações gerais (nome, WhatsApp, textos, horários, tracking, customização, etc).
- `produtos`: produtos do catálogo (nome, marca, categoria, tipoProdutoId/Nome, preços, tamanhos, imagem, status).
- `tipos_produto`: tipos dinâmicos e opções de tamanho.
- `categorias`: categorias do menu e organização do catálogo.
- `marcas`: marcas cadastradas (nome, slug, logo, descrição).
- `banners`: sliders e banners do catálogo.
- `menu_links`: links de menu (desktop/mobile).
- `redes_sociais`: ícones/links sociais do rodapé.
- `paginas`: páginas customizadas (slug, conteúdo).
- `metricas`: eventos de tracking interno (page_view, whatsapp_click, add_to_cart, etc).
- `usuarios`: usuários do painel admin + roles.
- `audit_logs`: trilha de auditoria do admin.
- `config_versions`: snapshots de versão de configuração.

## 5.2 Opcionais (recursos extras já suportados no código)
- `cupons`: cupons de desconto.
- `notificacoes/{userId}/mensagens`: mensagens/alerts por usuário.
- `carrinhos`: persistência de carrinho por usuário autenticado.
- `pedidos`: pedidos/checkout (quando ativado).
- `reviews`: avaliações de produtos.

---
# 6) Resumo do sistema

- **Tema claro/escuro** com auto e persistência
- **Hero slider** baseado nos banners do Firestore
- **Filtros inteligentes** com debounce
- **Carrinho lateral** + checkout via WhatsApp
- **Tracking** (Pixel, GA4, GTM) opcional
- **Métricas internas** gravadas em `metricas`
- **UI responsiva** mobile-first

---
# 7) Dica final

Se houver erros de permissão no console, verifique:
- Regras do Firestore publicadas
- Índices necessários criados
- Campos `ativo` verdadeiros nos documentos

Se o Pixel/GA/GTM for bloqueado por extensão (adblock), isso é esperado em testes locais.
