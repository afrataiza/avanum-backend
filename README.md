# Avanum Backend

Backend do Avanum, um diário de leitura gamificado. O projeto usa Supabase, PostgreSQL, Supabase Auth e Edge Functions executadas em runtime Deno.

## Comece aqui

O README é a referência operacional do backend. Ele concentra pré-requisitos, configuração local, comandos de desenvolvimento, testes e execução das Edge Functions.

Para uma visão mais ampla:

- `docs/QA-PLAYBOOK.md`: fluxo e critérios de QA.
- `docs/API-LOCAL.md`: exemplos detalhados de chamadas às Edge Functions.
- `docs/TECH-DOC.md`: arquitetura, domínio e decisões técnicas.
- `docs/PRD.md`: requisitos e visão funcional do produto.
- `supabase/seeds/README.md`: fixtures determinísticos de QA.

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

## Configuração inicial

Depois de clonar o repositório:

```bash
cd avanum-backend
```

O arquivo `.env.example` documenta as variáveis usadas pelas Edge Functions locais.

Quando necessário, crie o arquivo local:

```bash
cp .env.example .env
```

Preencha somente as variáveis necessárias para as integrações que estiver executando e nunca comite credenciais reais.

## Ambiente local

Prepare o Supabase e aplique as migrations:

```bash
deno task setup
```

Carregue o cenário determinístico de QA:

```bash
deno task seed:qa
```

Usuário QA padrão:

- Email: `qa@avanum.local`
- Senha: `avanum-local-qa`

Obtenha um token para chamadas autenticadas:

```bash
deno task login:qa
```

Detalhes dos fixtures estão em `supabase/seeds/README.md`.

## Testes

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

Teste de um arquivo específico:

```bash
deno test --allow-env supabase/functions/_shared/reading/update-reading-progress-service.test.ts
```

Filtrar pelo nome:

```bash
deno test --allow-env --filter="updates reading progress" supabase/functions/_shared
```

O wrapper `./scripts/test.sh` apenas delega para `deno task test`.

A task de testes descobre automaticamente arquivos `*.test.ts` em `supabase/functions/_shared`.

## Edge Functions localmente

Suba todas as funções:

```bash
deno task serve
```

Ou uma função específica:

```bash
deno task serve:books-search
deno task serve:book-details
deno task serve:start-reading
deno task serve:update-reading-progress
deno task serve:update-reading-status
deno task serve:map
```

As funções que usam integrações externas esperam as variáveis definidas no ambiente local.

Para chamadas manuais e contratos, consulte `docs/API-LOCAL.md`.

## Comandos rápidos

| Comando | Uso |
| --- | --- |
| `deno task setup` | Inicia o Supabase local e aplica as migrations sem carregar fixtures de QA. |
| `deno task seed:qa` | Restaura o estado determinístico do ambiente local de QA. |
| `deno task login:qa` | Autentica o usuário QA local e retorna o token. |
| `deno task test` | Executa toda a suíte local. |
| `deno task test:reading` | Executa os testes de Reading. |
| `deno task test:map` | Executa os testes de Map. |
| `deno task test:xp` | Executa os testes de XP. |
| `deno task serve` | Serve todas as Edge Functions. |

## Estrutura principal

```text
docs/
  API-LOCAL.md
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

## CI

O GitHub Actions executa, nesta ordem:

```text
Checkout
  ↓
Setup Deno
  ↓
Setup Supabase CLI
  ↓
Prepare environment
  ↓
Load QA fixtures
  ↓
Run test suite
```

O CI valida pull requests e pushes para `main`.

## Documentação

- `README.md`: referência operacional e ponto de entrada.
- `docs/QA-PLAYBOOK.md`: fluxo e critérios de QA.
- `docs/API-LOCAL.md`: cookbook das Edge Functions.
- `docs/TECH-DOC.md`: arquitetura e decisões técnicas.
- `docs/PRD.md`: requisitos do produto.
- `supabase/seeds/README.md`: fixtures e bootstrap de QA.
