# Avanum Backend

Backend do Avanum, um diário de leitura gamificado. O projeto usa Supabase, PostgreSQL, Supabase Auth e Edge Functions executadas em runtime Deno.

## Pré-requisitos

- Deno
- Supabase CLI
- PostgreSQL client (`psql`) para o bootstrap de QA

## Primeiros passos

Clone o repositório e prepare o ambiente local:

```bash
deno task setup
deno task seed:qa
```

Depois, rode a suíte:

```bash
deno task test
```

A task de testes descobre automaticamente arquivos `*.test.ts` em `supabase/functions/_shared`.

## Comandos do dia a dia

| Comando | Uso |
| --- | --- |
| `deno task setup` | Inicia o Supabase local e aplica as migrations sem carregar fixtures de QA. |
| `deno task seed:qa` | Restaura o estado determinístico do ambiente local de QA. |
| `deno task login:qa` | Faz login com o usuário QA local e imprime a resposta de autenticação. |
| `deno task test` | Executa toda a suíte local. |
| `deno task test:reading` | Executa os testes do domínio de Reading. |
| `deno task test:map` | Executa os testes do domínio de Map. |
| `deno task test:xp` | Executa os testes do domínio de XP. |
| `deno task serve` | Sobe todas as Edge Functions com o arquivo `.env`. |
| `deno task serve:books-search` | Sobe somente a Edge Function `books-search`. |
| `deno task serve:book-details` | Sobe somente a Edge Function `book-details`. |
| `deno task serve:start-reading` | Sobe somente a Edge Function `start-reading`. |
| `deno task serve:update-reading-progress` | Sobe somente a Edge Function `update-reading-progress`. |
| `deno task serve:update-reading-status` | Sobe somente a Edge Function `update-reading-status`. |
| `deno task serve:map` | Sobe somente a Edge Function `map`. |

## Teste direcionado

O Deno permite executar um arquivo específico:

```bash
deno test --allow-env supabase/functions/_shared/reading/update-reading-progress-service.test.ts
```

Também é possível filtrar pelo nome do teste:

```bash
deno test --allow-env --filter="updates reading progress" supabase/functions/_shared
```

Para usar o wrapper:

```bash
./scripts/test.sh
```

Ele apenas delega para `deno task test`.

## Edge Functions localmente

O Supabase CLI é responsável por servir as Edge Functions. As tasks do Deno padronizam esses comandos:

```bash
deno task serve
```

ou uma função específica:

```bash
deno task serve:books-search
```

As funções que usam integrações externas esperam as variáveis definidas no arquivo `.env`.

## Ambiente QA

O bootstrap de QA é determinístico e pode ser executado novamente para restaurar o estado esperado:

```bash
deno task seed:qa
```

Usuário QA padrão:

- Email: `qa@avanum.local`
- Senha: `avanum-local-qa`

Detalhes dos fixtures estão em `supabase/seeds/README.md`.

## Estrutura principal

```text
docs/              documentação técnica e produto
scripts/            automações locais
supabase/
  functions/        Edge Functions e domínio compartilhado
  migrations/       migrations PostgreSQL
  seed.sql          fixtures de QA
```

## Documentação

- `README.md`: instalação, comandos e operação local.
- `docs/TECH-DOC.md`: arquitetura, domínio e decisões técnicas.
- `docs/PRD.md`: requisitos do produto.
- `supabase/seeds/README.md`: detalhes do ambiente de QA.
- `docs/API-LOCAL.md`: guia da API local
