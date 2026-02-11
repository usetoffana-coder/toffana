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
   - `public/assets/js/core/config.js`

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
# 4) Índices + estrutura completa para repasse

A documentação completa (todas as coleções, campos, índices compostos e troubleshooting de acesso negado) está em:

- `FIRESTORE_HANDOFF.md`
- `firestore.indexes.json`

Deploy dos índices:

```bash
firebase deploy --only firestore:indexes
```

---
# 5) Resumo do sistema

- **Tema claro/escuro** com auto e persistência
- **Hero slider** baseado nos banners do Firestore
- **Filtros inteligentes** com debounce
- **Carrinho lateral** + checkout via WhatsApp
- **Tracking** (Pixel, GA4, GTM) opcional
- **Métricas internas** gravadas em `metricas`
- **UI responsiva** mobile-first

---
# 6) Dica final

Se houver erros de permissão no console, verifique:
- Regras do Firestore publicadas
- Índices necessários criados
- Campos `ativo` verdadeiros nos documentos

Se o Pixel/GA/GTM for bloqueado por extensão (adblock), isso é esperado em testes locais.
