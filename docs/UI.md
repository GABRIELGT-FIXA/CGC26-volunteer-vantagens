# UI.md — Guia de Interface e Componentes

## Identidade Visual

- **Tema**: Dark mode como padrão, com opção de light.
- **Paleta Principal**: fundo escuro (#0f0f0f), acento verde neon (#00ff88) para elementos ativos e conquistas, vermelho para alertas, cinza para elementos neutros.
- **Tipografia**: Fonte display impactante (ex: Space Grotesk, Syne ou Bebas Neue) para rankings e títulos; fonte legível (ex: DM Sans, Nunito) para corpo de texto.
- **Tom**: Gamificado, dinâmico, competitivo mas acessível.

---

## Páginas e Telas

### Tela de Entrada (Login/Cadastro)
- Campo de telefone centralizado e grande — ocupa largura total em mobile, limitado a `max-w-sm` em telas maiores.
- Após inserir telefone:
  - Número novo → formulário de cadastro desliza para cima.
  - Número existente → campo de senha aparece.
- Botão "Esqueci minha senha" visível apenas após detectar número existente.
- Padding lateral generoso em mobile para evitar toque nas bordas.

### Formulário de Cadastro
- Campos em ordem: nome completo, idade, time(s) (multi-select), telefone (readonly), foto de perfil (upload com preview circular), senha, confirmação de senha, pergunta de segurança (select), resposta.
- Progresso visual por etapas (stepper) para não sobrecarregar — cada etapa ocupa a tela inteira em mobile.
- Botões de navegação do stepper fixos no rodapé em mobile (sticky bottom bar).
- Preview da foto de perfil circular de tamanho fixo e centralizado em todos os breakpoints.

### Dashboard do Participante
- Card de pontuação pessoal com posição no ranking — largura total em mobile, card compacto em tablet/desktop.
- Lista de tarefas do dia: cards empilhados verticalmente em qualquer breakpoint; em tablet/desktop podem ser 2 colunas.
- Status visual claro com ícone + texto em mobile, tooltip em desktop:
  - 🔒 Bloqueada (fora da janela)
  - 📸 Aberta para Check-in (verde pulsante)
  - ✅ Check-in feito (aguardando check-out)
  - 📸 Aberta para Check-out (verde pulsante)
  - 🏆 Completa
  - ⏰ Perdida (janela encerrada sem participação)
- Botão de ação principal no card ocupa largura total em mobile.

### Tela de Registro de Foto
- Câmera ao vivo (react-webcam) ocupa toda a largura da tela em mobile; limitada e centralizada em tablet/desktop.
- Botão de upload de arquivo como alternativa sempre visível abaixo da câmera.
- Preview da foto antes de enviar — fullscreen em mobile com botões "Refazer" e "Confirmar" fixos no rodapé.
- Seleção de time aparece apenas se o usuário está em mais de um time — sheet de baixo para cima em mobile, modal centralizado em desktop.
- Temporizador regressivo sempre visível no topo, em destaque.
- Confirmação de envio bem-sucedido ocupa tela inteira antes de redirecionar.

### Ranking Individual
- **Mobile/tablet**: lista vertical com posição, avatar, nome, time(s) e pontuação; cada linha é um card tocável.
- **Desktop**: tabela com as mesmas colunas.
- Top 3 com destaque visual (ouro, prata, bronze) em qualquer breakpoint — avatar maior, fundo diferenciado.
- Linha do usuário logado sempre com highlight e fixada em posição visível (sticky) ao rolar em mobile.
- Atualização automática a cada 30 segundos.

### Ranking por Time
- Cards para cada time com nome, total de pontos e membros — 1 coluna em mobile, 2 em tablet, 3 em desktop.
- Ordenados por pontuação.
- Animação de subida/descida de posição quando atualiza.

### Área Admin — Layout Geral
- **Desktop/tablet (md+)**: sidebar lateral fixa com navegação: Dashboard, Usuários, Times, Tarefas, Campanhas, Rankings.
- **Mobile (< md)**: sidebar vira bottom navigation bar com ícones; o header exibe o título da página atual e um menu hambúrguer para ações secundárias.
- Header sempre visível: nome do admin e botão de logout.

### Admin — Gestão de Usuários
- **Desktop**: tabela com busca e filtros, modal de edição.
- **Mobile/tablet**: lista em cards por usuário; ao tocar abre sheet (drawer) de baixo para cima com os campos de edição.
- Edição de pontos inline sempre visível independente do breakpoint.

### Admin — Campanhas de Mensagem

**Layout desktop/tablet (md+) — dois painéis lado a lado:**

```
┌─────────────────────────────┬───────────────────────────┐
│         EDITOR              │         PREVIEW            │
│                             │                            │
│  Nome da campanha           │  ┌─────────────────────┐  │
│  [___________________]      │  │ 📱 WhatsApp Preview  │  │
│                             │  │─────────────────────│  │
│  Data e hora do disparo     │  │ Olá! 👋 A atividade  │  │
│  [11/06/2026] [07:45]       │  │ *Front Line*         │  │
│                             │  │ acontece hoje,       │  │
│  Mensagem                   │  │ 11/06, das 08:00     │  │
│  ┌─────────────────────┐    │  │ às 10:00. Vale       │  │
│  │ Olá! 👋 A atividade │    │  │ 350 pontos! 🏁       │  │
│  │ *{{taskName}}*...   │    │  └─────────────────────┘  │
│  └─────────────────────┘    │                            │
│                             │  Destinatários: 48 part.  │
│  Variáveis: [{{taskName}}]  │                            │
│  [{{date}}] [{{startTime}}] │                            │
│  [{{endTime}}] [{{points}}] │                            │
│                             │                            │
│  [Cancelar]  [Salvar]       │                            │
└─────────────────────────────┴───────────────────────────┘
```

**Layout mobile (< md) — painéis empilhados com abas:**

```
┌─────────────────────────┐
│  [ Editar ] [ Preview ] │  ← abas para alternar
├─────────────────────────┤
│  Nome da campanha       │
│  [___________________]  │
│                         │
│  Data e hora do disparo │
│  [11/06/2026] [07:45]   │
│                         │
│  Mensagem               │
│  ┌─────────────────┐    │
│  │ *{{taskName}}*  │    │
│  └─────────────────┘    │
│                         │
│  Variáveis:             │
│  [{{taskName}}][{{date}}]
│  [{{startTime}}]...     │
│                         │
│  [Cancelar]  [Salvar]   │
└─────────────────────────┘
```

Ao tocar na aba "Preview", o painel de editor some e o preview ocupa a tela inteira.

**Comportamentos do editor:**
- Chips clicáveis das variáveis disponíveis inserem a variável na posição do cursor.
- O painel de preview atualiza em tempo real a cada keystroke, substituindo variáveis por valores de exemplo fixos (ex: `{{taskName}}` → "Front Line", `{{points}}` → "350").
- Formatação WhatsApp renderizada no preview: `*negrito*`, `_itálico_`, emojis.
- Contador de caracteres visível (WhatsApp suporta até 4096).
- Variável não reconhecida aparece destacada em vermelho no editor e no preview.

**Lista de campanhas:**
- **Desktop/tablet**: tabela com colunas: Nome, Agendado para, Status (chip colorido), Destinatários, Ações.
- **Mobile**: cards empilhados com nome, data/hora, chip de status e menu de ações (três pontos).
- Status: `SCHEDULED` (azul) · `SENDING` (amarelo) · `SENT` (verde) · `FAILED` (vermelho) · `CANCELLED` (cinza).
- Ações disponíveis por status:
  - `SCHEDULED`: Editar · Disparar agora · Cancelar
  - Demais: Visualizar (somente leitura)

---

### Admin — Gestão de Tarefas
- Formulário com date/time pickers nativos em mobile (`<input type="datetime-local">`), pickers customizados em desktop.
- Preview da configuração de janela: "Check-in: 06:00 → 06:10 | Check-out: 07:00 → 07:10".
- **Desktop**: lista de participações com miniaturas das fotos em tabela.
- **Mobile/tablet**: lista de participações em cards com foto em destaque, clicável para ampliar.

---

## Componentes Reutilizáveis

- `<WindowStatus />` — exibe se janela está aberta/fechada com countdown.
- `<PhotoCapture />` — câmera + upload com preview e validação.
- `<TeamSelect />` — select de time (condicional: aparece só se usuário tem >1 time).
- `<RankingTable />` — tabela de ranking com highlight e animações.
- `<UserAvatar />` — foto de perfil circular com fallback de inicial.
- `<TaskCard />` — card de tarefa com status visual e ação principal.

---

## Responsividade

Toda a aplicação — área do participante e área admin — é responsiva para celular e tablet. Nenhuma tela tem comportamento exclusivo de desktop.

### Breakpoints (Tailwind)

| Alias | Largura | Dispositivo alvo |
|-------|---------|-----------------|
| `base` | 0–639px | Celular (prioridade máxima) |
| `sm` | 640px+ | Celular grande / landscape |
| `md` | 768px+ | Tablet |
| `lg` | 1024px+ | Desktop |

### Regras Gerais

- **Mobile-first**: todas as classes base são para celular; `md:` e `lg:` adicionam comportamentos progressivos.
- **Toque**: áreas clicáveis com mínimo de 44×44px (diretrize Apple/Google). Nunca depender de hover para revelar informação.
- **Navegação admin**: sidebar em `lg+`, bottom navigation bar em mobile/tablet.
- **Tabelas**: nunca truncar dados em scroll horizontal — converter em cards ou listas em `base`/`sm`.
- **Modais**: em mobile viram sheets (drawers) deslizando de baixo para cima, usando `max-h-[90vh]` + scroll interno.
- **Formulários**: campos sempre `w-full` em mobile; podem ter largura limitada em `md+`.
- **Fontes**: tamanho mínimo 16px em inputs para evitar zoom automático no iOS.
- **Imagens/câmera**: sempre `object-cover` e proporções fixas para evitar reflow em diferentes telas.
- **Sticky elements**: bottom bar de ações em formulários longos (mobile); header sempre fixo no topo.
- **Scroll**: evitar scroll horizontal em qualquer breakpoint; usar `overflow-x-hidden` no layout raiz.

---

## Estados de Loading e Erro

- Skeleton loaders em listas e rankings.
- Toast notifications para sucesso/erro de ações.
- Estado de erro em formulários com mensagem por campo.
- Página de erro 404 e 500 customizadas.
