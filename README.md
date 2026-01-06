# 🙏 Missão IEAB Dashboard

> Sistema de Gestão Visual de Eventos para gestão de metas de discipulado em tempo real.

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)

## 📸 Preview

O dashboard possui duas telas sincronizadas em tempo real:

| Tela do Projetor | Painel Admin |
|------------------|--------------|
| Exibição para telão | Controle mobile |

## ✨ Funcionalidades

### 🎯 Gestão de Metas
- **Meta editável** - Altere o objetivo de vidas a qualquer momento
- **Progresso visual** - Barra de progresso animada com porcentagem
- **Contador animado** - Números que animam suavemente ao mudar

### 📊 Duas Telas Sincronizadas
- **Tela Realidade** - Exibe cards de cada igreja com discípulos e células
- **Tela Metas** - Contador gigante focado no objetivo global
- **Sincronização cross-tab** - Mudanças refletem instantaneamente entre abas

### 🏛️ Gestão de Igrejas
- **CRUD completo** - Adicione, edite e remova igrejas
- **Detalhes expandíveis** - Clique nos cards para ver endereço e pastores
- **Estatísticas por local** - Discípulos e células por congregação

### 📝 Registro de Compromissos
- **Formulário intuitivo** - Nome, quantidade e local
- **Botões rápidos** - +1, +3, +5, +10 vidas
- **Histórico** - Veja os últimos 50 registros com timestamps

### 🎉 Celebrações
- **Confetti** - Explosão de confete a cada novo compromisso
- **Som de celebração** - Tom musical nos milestones (25%, 50%, 75%, 100%)
- **Toasts cross-tab** - Notificações aparecem no projetor

### 💎 Design Premium
- **Glassmorphism** - Efeitos de vidro modernos
- **Fonte Sansation** - Tipografia elegante e espiritual
- **Tema Deep Blue & Gold** - Cores premium e harmoniosas
- **Animações Framer Motion** - Transições suaves e fluidas

### ♿ Acessibilidade
- **ARIA labels** - Navegação por leitores de tela
- **Navegação por teclado** - Tab e Enter funcionam em tudo
- **Responsivo** - Funciona em qualquer tamanho de tela

## 🚀 Deploy no Vercel

### 1. Fork/Clone este repositório

### 2. Importe no Vercel
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório `missaoieab`
3. Clique em **Deploy**

### 3. Pronto!
- Projetor: `https://seu-projeto.vercel.app/`
- Admin: `https://seu-projeto.vercel.app/admin`

## 💻 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🗂️ Estrutura do Projeto

```
src/
├── components/
│   ├── layout/
│   │   └── ProjectorLayout.tsx   # Layout da tela de projeção
│   ├── ui/
│   │   ├── Confetti.tsx          # Animação de confete
│   │   └── StatsCard.tsx         # Cards interativos
│   └── Toaster.tsx               # Sistema de notificações
├── context/
│   └── ChurchContext.tsx         # Estado global + localStorage
├── hooks/
│   └── useAnimatedNumber.ts      # Hook para animar números
├── views/
│   ├── AdminView.tsx             # Painel de controle
│   └── ProjectorView.tsx         # Tela do projetor
├── App.tsx                       # Rotas
├── main.tsx                      # Entry point
└── index.css                     # Estilos globais
```

## 🛠️ Tech Stack

| Tecnologia | Uso |
|------------|-----|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Animações |
| **Lucide React** | Ícones |
| **Canvas Confetti** | Celebrações |
| **React Router** | Navegação |

## 📱 Como Usar

### No Evento
1. Abra a **tela do projetor** (`/`) no telão
2. Abra o **painel admin** (`/admin`) no celular
3. Registre compromissos pelo celular
4. Veja atualizações instantâneas no telão!

### Configuração
- Edite a **meta global** no topo do admin
- Adicione/remova **igrejas** na seção de configuração
- Preencha **endereços e pastores** para os cards expandíveis

## 🎨 Customização

### Cores (tailwind.config.js)
```js
colors: {
  'deep-blue': '#1e3a5f',
  'gold': '#fbbf24',
}
```

### Fonte
A fonte **Sansation** é importada via CDN em `src/index.css`.

## 📄 Licença

MIT © Missão IEAB

---

<p align="center">
  <strong>Desenvolvido com ❤️ para a glória de Deus</strong>
</p>
