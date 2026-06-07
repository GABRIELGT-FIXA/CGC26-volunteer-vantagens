# CLAUDE.md — Sistema de Gestão de Participação e Rankings

## Visão Geral do Projeto

Você está construindo uma **plataforma web de gestão de participação em tarefas com ranking por pontos**. O sistema permite que participantes comprovem presença em tarefas via foto dentro de janelas de tempo controladas, acumulem pontos e sejam rankeados individualmente e por time.

## Documentos de Referência

Leia todos estes arquivos antes de escrever qualquer código:

- `CLAUDE.md` — este arquivo, visão geral e regras gerais
- `docs/ARCHITECTURE.md` — stack, estrutura de pastas e decisões técnicas
- `docs/DATABASE.md` — schema completo do banco de dados
- `docs/AUTH.md` — fluxo de autenticação e segurança
- `docs/FEATURES.md` — especificação funcional completa de cada feature
- `docs/API.md` — endpoints da API REST
- `docs/WHATSAPP.md` — integração com Evolution API
- `docs/UI.md` — guia de interface e componentes

---

## Regras Gerais de Desenvolvimento

1. **Nunca pule documentação** — antes de implementar qualquer módulo, releia o `.md` correspondente.
2. **Um arquivo por responsabilidade** — não concentre lógica. Separe rotas, serviços, modelos e controllers.
3. **Variáveis de ambiente** — toda config sensível vai em `.env`. Nunca hardcode.
4. **Validação em camadas** — valide no frontend, no controller e no service.
5. **Erros explícitos** — nunca retorne erro genérico. Sempre informe o motivo ao cliente.
6. **Consistência de timezone** — todo horário armazenado em UTC, exibido convertido para o timezone configurado no `.env`.
7. **Commits atômicos** — cada feature implementada deve ser um commit separado com mensagem clara.
8. **Não invente campos** — se um campo não está no `DATABASE.md`, não crie sem perguntar.
9. **Sem mock data em produção** — seeds são apenas para desenvolvimento.
10. **Cobertura de testes mínima** — escreva ao menos testes unitários para lógica de janelas de tempo e pontuação.
