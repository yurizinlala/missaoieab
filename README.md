# 🙏 Missão IEAB Dashboard

> Sistema de Gestão Visual de Eventos com Sincronização em Tempo Real via Supabase.

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)

## 📸 Funcionalidades
- **Sincronização Cloud**: Mudanças no celular refletem instantaneamente no PC (e vice-versa).
- **Offline First**: Funciona com localStorage se a internet cair.
- **Painel Admin**: Controle total (Metas, Igrejas, Histórico, Reset).
- **Projetor**: Animações, sons e visual imersivo.

## 🚀 Configuração Rápida (Supabase + Vercel)

Para que a sincronização funcione entre dispositivos diferentes, você precisa de um banco de dados **Supabase** (gratuito).

### 1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie um projeto.
2. Vá em **SQL Editor** no menu lateral.
3. Copie o conteúdo do arquivo `supabase_setup.sql` (disponível neste repo ou artefato) e execute.

### 2. Configurar Variáveis no Vercel
1. No painel do Supabase, vá em **Project Settings > API**.
2. Copie:
   - `Project URL`
   - `anon public` key
3. No seu projeto no **Vercel**, vá em **Settings > Environment Variables**.
4. Adicione duas variáveis:
   - `VITE_SUPABASE_URL`: (Cole o Project URL)
   - `VITE_SUPABASE_ANON_KEY`: (Cole a anon public key)
5. Faça um novo **Redeploy** (ou push no git).

Pronto! Agora o sistema está conectado nuvem.

## 💻 Desenvolvimento Local

1. Crie um arquivo `.env` na raiz:
   ```bash
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_aqui
   ```
2. Rode o projeto:
   ```bash
   npm install
   npm run dev
   ```

## 🛠️ Tecnologias
- **Frontend**: React, Vite, Framer Motion
- **Backend/Sync**: Supabase (PostgreSQL + Realtime)
- **Estilo**: Tailwind CSS

## 📄 Licença
MIT © Missão IEAB
