# Avanum Backend

Backend do Avanum, um diário de leitura gamificado. O projeto usa Supabase, PostgreSQL, Supabase Auth e Edge Functions executadas em runtime Deno.

## Comece aqui

Para uma pessoa nova no projeto:

1. Leia este README para entender o backend e os comandos principais.
2. Siga `docs/DEVELOPER-ONBOARDING.md` para configurar um ambiente local do zero.
3. Use `docs/QA-PLAYBOOK.md` para reproduzir cenários de QA.
4. Consulte `docs/API-LOCAL.md` para testar as Edge Functions manualmente.
5. Consulte `docs/TECH-DOC.md` para arquitetura, domínio e decisões técnicas.
6. Consulte `docs/PRD.md` para contexto funcional do produto.

## O que existe hoje

O backend concentra:

- catálogo de livros via Google Books;
- biblioteca pessoal;
- jornada de leitura;
- XP e Descobertas;
- Expedições;
- Mapa;
- Edge Functions;
- PostgreSQL, migrations e RLS;
- ambiente local determinístico de QA.

O frontend é mantido separadamente.

## Pré-requisitos

- Git
- Deno v2
- Supabase CLI
- PostgreSQL client (`psql`)
- Docker com suporte ao ambiente local do Supabase
- `curl`

Confirme as instalações:

```bash
git --version
deno --version
supabase --version
psql --version
curl --version
```

## Primeiros passos

Depois de clonar:

```bash
deno task setup
deno task seed:qa
```

Execute a suíte:

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

Teste um arquivo específico:

```bash
deno test --allow-env supabase/functions/_shared/reading/update-reading-progress-service.test.ts
```

Filtre pelo nome do teste:

```bash
deno test --allow-env --filter="updates reading progress" supabase/functions/_shared
```

O wrapper:

```bash
./scripts/test.sh
```

apenas delega para `deno task test`.

## Edge Functions localmente

Suba todas as funções:

```bash
deno task serve
```

Ou uma função específica:

```bash
deno task serve:books-search
```

As funções que usam integrações externas esperam as variáveis definidas no ambiente local. Use `.env.example` como referência e nunca comite secrets reais.

## Ambiente QA

O bootstrap de QA é determinístico:

```bash
deno task seed:qa
```

Usuário QA padrão:

- Email: `qa@avanum.local`
- Senha: `avanum-local-qa`

Login:

```bash
deno task login:qa
```

Detalhes dos fixtures estão em `supabase/seeds/README.md`.

## Estrutura principal

```text
docs/
  API-LOCAL.md
  DEVELOPER-ONBOARDING.md
  PRD.md
  QA-PLAYBOOK.md
  TECH-DOC.md
scripts/
supabase/
  functions/
  migrations/
  sql/
  seed.sql
  seeds/
.env.example
deno.json
```

## Fluxo de contribuição

1. Criar ou revisar o card no Jira.
2. Criar branch usando o ID do card.
3. Implementar a mudança.
4. Rodar testes locais.
5. Fazer validação manual quando aplicável.
6. Abrir PR com o padrão `[ATSA-ID] descrição`.
7. Aguardar revisão.
8. Fazer merge após aprovação.
9. Finalizar o card no Jira.
10. Atualizar a documentação quando a mudança afetar arquitetura, contratos ou operação.

O CI valida PRs e pushes para `main` usando o mesmo fluxo de setup, fixtures e testes do ambiente local.

## Documentação

- `README.md`: porta de entrada e comandos rápidos.
- `docs/DEVELOPER-ONBOARDING.md`: onboarding completo.
- `docs/QA-PLAYBOOK.md`: estratégia de QA local e validação manual.
- `docs/API-LOCAL.md`: cookbook das Edge Functions.
- `docs/TECH-DOC.md`: arquitetura e decisões técnicas.
- `docs/PRD.md`: requisitos do produto.
- `supabase/seeds/README.md`: fixtures e bootstrap de QA.
