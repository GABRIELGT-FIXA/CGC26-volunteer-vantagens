# AUTH.md — Autenticação e Segurança

## Fluxo de Cadastro (Participante)

1. Usuário acessa a plataforma sem estar logado.
2. Insere o **número de telefone** (formato: DDD + número, ex: 11999999999).
3. Sistema verifica se o número já existe:
   - **Existe** → redireciona para tela de login (pede senha).
   - **Não existe** → abre formulário de cadastro completo.
4. Formulário de cadastro contém:
   - Nome completo
   - Idade
   - Time(s) — seleção múltipla dos times cadastrados pelo admin
   - Número de celular (já preenchido)
   - Foto de perfil (upload obrigatório)
   - Senha (mínimo 6 caracteres)
   - Confirmação de senha
   - Pergunta de segurança (select com opções pré-definidas)
   - Resposta da pergunta de segurança
5. Ao submeter, backend salva o usuário com `role = PARTICIPANT`.

---

## Fluxo de Login

1. Usuário insere telefone → sistema detecta que já existe → pede senha.
2. Backend valida telefone + senha (bcrypt compare).
3. Retorna `accessToken` (JWT, 15min) e define `refreshToken` em httpOnly cookie (7 dias).
4. Frontend armazena `accessToken` em memória (Zustand), nunca em localStorage.

---

## Fluxo de Recuperação de Senha

1. Usuário clica em "Esqueci minha senha".
2. Insere o número de telefone.
3. Sistema retorna qual pergunta de segurança o usuário escolheu.
4. Usuário responde a pergunta.
5. Backend compara a resposta (bcrypt compare).
6. Se correta, retorna token temporário de reset (válido por 15 minutos).
7. Usuário define nova senha com esse token.

---

## Perguntas de Segurança Disponíveis

```typescript
export const SECURITY_QUESTIONS = [
  "Qual o nome do seu primeiro animal de estimação?",
  "Qual o nome da cidade onde você nasceu?",
  "Qual o nome do seu melhor amigo de infância?",
  "Qual era o modelo do primeiro carro da sua família?",
  "Qual o nome da sua mãe antes de casar?",
  "Qual era o nome da sua escola primária?",
  "Qual o time de futebol que você torce?",
  "Qual o apelido que você tinha na infância?",
];
```

---

## Fluxo do Administrador

- Admin é criado via seed ou variável de ambiente (`ADMIN_PHONE`, `ADMIN_PASSWORD`).
- Não há cadastro público de admin — apenas o backend pode criar um.
- Login do admin usa o mesmo endpoint de login, diferenciado pelo `role` no JWT.
- O frontend redireciona para área admin baseado no `role` retornado.

---

## Middleware de Autenticação

```typescript
// middleware/auth.ts
// 1. Extrai Authorization: Bearer <token>
// 2. Verifica e decodifica JWT
// 3. Injeta user no req.user
// 4. Se expirado, retorna 401 para o cliente renovar via refresh token
```

## Middleware de Autorização Admin

```typescript
// middleware/adminOnly.ts
// Verifica se req.user.role === 'ADMIN'
// Caso contrário, retorna 403
```

---

## Segurança Geral

- Senhas e respostas de segurança armazenadas com bcrypt (salt rounds: 12).
- Tokens JWT assinados com secret via env.
- Rate limiting nas rotas de login e recuperação de senha (máx 10 tentativas / 15 min por IP).
- Uploads validados por tipo MIME (apenas imagens: jpeg, png, webp).
- Tamanho máximo de upload: 5MB.
