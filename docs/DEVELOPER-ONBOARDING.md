# Avanum Backend — Developer Onboarding

Este guia é o ponto de entrada para uma pessoa nova no backend do Avanum.

## 1. Contexto rápido

O Avanum é um diário de leitura gamificado. O backend está no repositório `avanum-backend` e concentra:

- PostgreSQL gerenciado pelo Supabase;
- Supabase Auth;
- Row Level Security (RLS);
- Edge Functions em Deno;
- regras de domínio server-side;
- migrations e fixtures determinísticos de QA.

O frontend é mantido separadamente em outro repositório.

Para entender o produto, use `docs/PRD.md`.
Para entender arquitetura e decisões técnicas, use `docs/TECH-DOC.md`.

## 2. Pré-requisitos

Instale:

- Git;
- Deno v2;
- Supabase CLI;
- PostgreSQL client (`psql`);
- `curl` para validações manuais de API.

Confirme:

```bash
git --version
deno --version
supabase --version
psql --version
curl --version
```

## 3. Clone e configuração

Clone o repositório e entre na pasta:

```bash
git clone <URL_DO_REPOSITORIO>
cd avanum-backend
```

O arquivo `.env.example` documenta as variáveis necessárias para servir Edge Functions localmente.

Para executar funções que usam integrações externas, copie o exemplo para um arquivo local e preencha somente os secrets necessários:

```bash
cp .env.example .env
```

Nunca comite credenciais reais.

## 4. Bootstrap local

O fluxo oficial começa com duas tasks:

```bash
deno task setup
deno task seed:qa
```

### `deno task setup`

- inicia o Supabase local;
- valida/aplica as migrations via reset;
- prepara o banco para desenvolvimento.

### `deno task seed:qa`

- restaura o estado determinístico de QA;
- cria/atualiza o usuário QA;
- carrega os fixtures de domínio.

Usuário QA padrão:

- Email: `qa@avanum.local`
- Senha: `avanum-local-qa`

Detalhes dos fixtures: `supabase/seeds/README.md`.

## 5. Validar o ambiente

Após o bootstrap:

```bash
deno task login:qa
```

A task retorna o `access_token` do usuário QA local.

Para validar as Edge Functions manualmente, consulte `docs/API-LOCAL.md`.

## 6. Executar testes

Suíte completa:

```bash
deno task test
```

Testes por domínio:

```bash
deno task test:reading
deno task test:map
deno task test:xp
```

Teste de um arquivo:

```bash
deno test --allow-env supabase/functions/_shared/reading/update-reading-progress-service.test.ts
```

Filtrar por nome:

```bash
deno test --allow-env --filter="updates reading progress" supabase/functions/_shared
```

O CI também executa a suíte via `deno task test`.

## 7. Servir Edge Functions localmente

Para subir todas:

```bash
deno task serve
```

Para uma função específica:

```bash
deno task serve:books-search
deno task serve:book-details
deno task serve:start-reading
deno task serve:update-reading-progress
deno task serve:update-reading-status
deno task serve:map
```

## 8. Estrutura do repositório

```text
.
├── docs/
│   ├── API-LOCAL.md
│   ├── DEVELOPER-ONBOARDING.md
│   ├── PRD.md
│   ├── QA-PLAYBOOK.md
│   └── TECH-DOC.md
├── scripts/
│   ├── setup.sh
│   ├── seed-qa.sh
│   ├── qa-login.sh
│   └── test.sh
├── supabase/
│   ├── functions/
│   ├── migrations/
│   ├── sql/
│   ├── seed.sql
│   └── seeds/
├── .env.example
└── deno.json
```

## 9. Fluxo oficial de desenvolvimento

1. Criar ou revisar o card no Jira.
2. Criar a branch usando o ID do card.
3. Implementar a mudança no repositório correspondente.
4. Executar os testes locais.
5. Validar fluxos manuais quando necessário.
6. Abrir PR com o padrão `[ATSA-ID] descrição`.
7. Aguardar revisão.
8. Fazer merge após aprovação.
9. Finalizar o card no Jira.
10. Atualizar a documentação quando houver mudança de contrato, arquitetura ou fluxo de desenvolvimento.

Exemplo:

```text
ATSA-21
    ↓
branch: ATSA-21
    ↓
implementação
    ↓
deno task test
    ↓
PR: [ATSA-21] Documentação e onboarding
    ↓
review
    ↓
merge
```

## 10. Boas práticas

- Prefira `deno task` às chamadas manuais longas quando existir uma task equivalente.
- Não altere fixtures de QA para testar dados ad hoc sem entender o impacto no cenário determinístico.
- Não use `SERVICE_ROLE_KEY` no frontend.
- Não comite `.env` ou credenciais.
- Regras de negócio devem permanecer server-side.
- Atualize `docs/TECH-DOC.md` quando uma decisão mudar arquitetura, persistência ou contratos.
- Use `docs/API-LOCAL.md` para reproduzir chamadas de integração.

## 11. Próximas referências

- Produto: `docs/PRD.md`
- Arquitetura: `docs/TECH-DOC.md`
- QA: `docs/QA-PLAYBOOK.md`
- API local: `docs/API-LOCAL.md`
- Fixtures: `supabase/seeds/README.md`
