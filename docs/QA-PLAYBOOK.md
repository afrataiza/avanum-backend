# Avanum Backend — QA Playbook

Este guia descreve como validar o backend do Avanum localmente e como reproduzir os principais fluxos de QA.

## 1. Objetivo

O QA local deve permitir que uma pessoa reproduza cenários conhecidos sem depender de dados manuais ou de um estado anterior do banco.

O cenário oficial usa:

- Supabase local;
- banco resetável;
- usuário QA determinístico;
- fixtures de domínio;
- suíte automatizada;
- chamadas manuais às Edge Functions quando necessário.

## 2. Pré-requisitos

Antes de iniciar:

```bash
deno --version
supabase --version
psql --version
curl --version
```

O Docker usado pelo Supabase local também precisa estar disponível e em execução.

## 3. Bootstrap de ambiente limpo

Para preparar um ambiente local:

```bash
deno task setup
deno task seed:qa
```

O primeiro comando sobe o Supabase e aplica as migrations por reset.

O segundo comando:

1. reseta o banco sem executar o seed automático;
2. provisiona o usuário QA;
3. carrega os fixtures determinísticos.

Usuário QA padrão:

```text
email: qa@avanum.local
senha: avanum-local-qa
```

Para autenticar:

```bash
deno task login:qa
```

Guarde o `access_token` retornado para as chamadas autenticadas.

## 4. Suíte automatizada

Execute tudo:

```bash
deno task test
```

Domínios específicos:

```bash
deno task test:reading
deno task test:map
deno task test:xp
```

Um teste isolado pode ser executado diretamente com Deno.

Uma alteração deve passar pela suíte relevante antes de abrir o PR.

## 5. Servir as Edge Functions

Em outro terminal:

```bash
deno task serve
```

Base URL:

```text
http://127.0.0.1:54321/functions/v1
```

Ou sirva apenas a função necessária usando as tasks específicas documentadas em `docs/DEVELOPER-ONBOARDING.md`.

## 6. Variáveis locais

As variáveis esperadas estão em `.env.example`.

Para chamadas locais autenticadas, configure pelo menos as variáveis de Supabase necessárias ao ambiente.

Secrets de integrações externas devem permanecer fora do repositório.

## 7. Fluxos manuais

### 7.1 Buscar livro

Endpoint:

```http
GET /books-search?q=the%20hobbit
```

Exemplo:

```bash
curl "$BASE_URL/books-search?q=the%20hobbit"
```

Validar:

- resposta HTTP de sucesso;
- contrato próprio do Avanum;
- lista de livros;
- ausência de dependência do payload bruto do provider.

### 7.2 Detalhar livro

```bash
curl "$BASE_URL/book-details?id=<BOOK_ID>"
```

Validar os dados principais e o tratamento de metadados opcionais.

### 7.3 Adicionar à biblioteca

```bash
curl -X POST "$BASE_URL/add-to-library" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "book": {
      "externalId": "qa-demo-book",
      "title": "Livro de demonstração",
      "authors": ["Autora de Demonstração"],
      "synopsis": "Livro usado para validar a integração local.",
      "coverUrl": null,
      "publicationYear": 2026,
      "categories": ["Fiction"],
      "language": "pt-BR",
      "isbn10": null,
      "isbn13": null
    }
  }'
```

Validar:

- autenticação obrigatória;
- livro persistido;
- relacionamento com o usuário autenticado;
- ausência de duplicação para a mesma relação.

### 7.4 Iniciar uma aventura

```bash
curl -X POST "$BASE_URL/start-reading" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userBookId": "20000000-0000-0000-0000-000000000001",
    "format": "physical",
    "totalUnits": 300
  }'
```

Validar:

- ownership;
- formato permitido;
- total positivo;
- criação da Reading;
- sincronização com UserBook;
- XP de início;
- idempotência.

### 7.5 Atualizar progresso

Exemplo usando o fixture do Hobbit:

```bash
curl -X PUT "$BASE_URL/update-reading-progress" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "readingId": "30000000-0000-0000-0000-000000000001",
    "currentUnits": 150
  }'
```

Validar:

- progresso absoluto;
- progresso não diminui;
- progresso não ultrapassa o total;
- marcos de 10%;
- XP de marco;
- ausência de duplicidade;
- conclusão automática ao atingir o total.

### 7.6 Pausar e retomar

Pausar:

```bash
curl -X PUT "$BASE_URL/update-reading-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "readingId": "30000000-0000-0000-0000-000000000001",
    "status": "paused"
  }'
```

Retomar:

```bash
curl -X PUT "$BASE_URL/update-reading-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "readingId": "30000000-0000-0000-0000-000000000001",
    "status": "reading"
  }'
```

Validar:

- transição permitida;
- progresso preservado;
- timestamps coerentes;
- nenhum XP adicional.

### 7.7 Abandonar

```bash
curl -X PUT "$BASE_URL/update-reading-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "readingId": "30000000-0000-0000-0000-000000000001",
    "status": "abandoned"
  }'
```

Validar que o histórico permanece e que a leitura encerrada não pode voltar ao fluxo ativo.

### 7.8 Consultar detalhes

```bash
curl "$BASE_URL/reading-details?readingId=30000000-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer $TOKEN"
```

Validar ownership e consistência entre Reading, UserBook e livro.

### 7.9 Descobertas

Catálogo:

```bash
curl "$BASE_URL/achievements" \
  -H "Authorization: Bearer $TOKEN"
```

Descobertas da pessoa:

```bash
curl "$BASE_URL/user-achievements" \
  -H "Authorization: Bearer $TOKEN"
```

Validar:

- catálogo ativo;
- ownership da consulta;
- concessão única;
- critérios calculados no backend.

### 7.10 Expedições

Listar:

```bash
curl "$BASE_URL/expeditions" \
  -H "Authorization: Bearer $TOKEN"
```

Criar:

```bash
curl -X POST "$BASE_URL/create-expedition" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cem páginas",
    "description": "Ler cem páginas durante a expedição.",
    "objectiveType": "pages_read",
    "targetValue": 100,
    "startsAt": "2026-09-29T00:00:00Z",
    "endsAt": "2026-10-29T23:59:59Z"
  }'
```

Validar progresso e idempotência ao usar a mesma chave de operação.

### 7.11 Mapa

```bash
curl "$BASE_URL/map" \
  -H "Authorization: Bearer $TOKEN"
```

Validar ownership e o estado esperado dos nós do fixture QA.

## 8. Reset e reprodução

Para voltar ao cenário oficial:

```bash
deno task seed:qa
```

Depois, autentique novamente se necessário:

```bash
deno task login:qa
```

O objetivo é que o mesmo fluxo possa ser reproduzido por outra pessoa usando os mesmos comandos.

## 9. Checklist antes do PR

- [ ] Suíte relevante passando localmente.
- [ ] `deno task test` passando quando houver mudança de domínio compartilhado.
- [ ] Migrations aplicando após reset limpo.
- [ ] Fixtures QA carregando sem intervenção manual.
- [ ] Fluxo manual validado quando a mudança altera uma Edge Function.
- [ ] RLS/ownership considerado.
- [ ] Idempotência considerada para operações repetíveis.
- [ ] Nenhum secret commitado.
- [ ] Documentação atualizada se contrato, arquitetura ou operação mudarem.

## 10. CI

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

O CI é a validação mínima obrigatória para PRs direcionados à `main`.

## 11. Critério de aceite de QA

Uma mudança é considerada validada quando:

1. o ambiente limpo pode ser preparado;
2. migrations são aplicadas por reset;
3. fixtures determinísticos carregam;
4. a suíte automatizada passa;
5. os fluxos manuais relevantes passam;
6. ownership, idempotência e estados inválidos são considerados;
7. outro desenvolvedor consegue reproduzir o cenário seguindo esta documentação.
