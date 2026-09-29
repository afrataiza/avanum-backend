# API Local Cookbook

Guia de integração e teste manual das Edge Functions do Avanum em ambiente local.

## 1. Pré-requisitos

Suba o ambiente e carregue os fixtures determinísticos:

```bash
deno task setup
deno task seed:qa
deno task login:qa
```

Em outro terminal, sirva as funções:

```bash
deno task serve
```

Aponte os exemplos para a API local:

```bash
export BASE_URL=http://127.0.0.1:54321/functions/v1
export TOKEN="<TOKEN_DO_LOGIN_QA>"
```

O `TOKEN` é o `access_token` retornado por `deno task login:qa`.

## 2. IDs determinísticos do ambiente QA

Os fixtures locais são definidos em `supabase/seed.sql`.

| Recurso | ID |
| --- | --- |
| Livro — The Hobbit | `10000000-0000-0000-0000-000000000001` |
| Livro — 1984 | `10000000-0000-0000-0000-000000000002` |
| Livro — Project Hail Mary | `10000000-0000-0000-0000-000000000003` |
| Livro — The Little Prince | `10000000-0000-0000-0000-000000000004` |
| UserBook — The Hobbit | `20000000-0000-0000-0000-000000000001` |
| UserBook — 1984 | `20000000-0000-0000-0000-000000000002` |
| UserBook — Project Hail Mary | `20000000-0000-0000-0000-000000000003` |
| UserBook — The Little Prince | `20000000-0000-0000-0000-000000000004` |
| Reading — The Hobbit | `30000000-0000-0000-0000-000000000001` |
| Reading — Project Hail Mary | `30000000-0000-0000-0000-000000000002` |
| Reading — The Little Prince | `30000000-0000-0000-0000-000000000003` |
| UserExpedition — Travessia QA | `70000000-0000-0000-0000-000000000001` |
| UserExpedition — Primeiro destino QA | `70000000-0000-0000-0000-000000000002` |

> Os IDs acima são fixtures locais. Eles não representam identificadores válidos no ambiente remoto.

## 3. Autenticação

As funções de domínio autenticadas esperam:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

Exemplo:

```bash
-H "Authorization: Bearer $TOKEN"
```

As funções `books-search` e `book-details` não exigem autenticação no handler atual.

## 4. Book Catalog

### 4.1 Buscar livros

```http
GET /functions/v1/books-search?q=<query>
```

```bash
curl "$BASE_URL/books-search?q=the%20hobbit"
```

Resposta:

```json
{
  "items": [
    {
      "id": "…",
      "title": "The Hobbit",
      "authors": ["J. R. R. Tolkien"],
      "synopsis": "…",
      "coverUrl": "…",
      "publicationYear": 1937,
      "categories": ["Fantasy"],
      "language": "en",
      "isbn10": "0261102214",
      "isbn13": "9780261102214"
    }
  ],
  "total": 1
}
```

O resultado é um contrato próprio do Avanum.

### 4.2 Detalhar um livro

```http
GET /functions/v1/book-details?id=<book-id>
```

Use um ID retornado por `books-search`:

```bash
curl "$BASE_URL/book-details?id=<BOOK_ID>"
```

## 5. Biblioteca

### 5.1 Adicionar livro à biblioteca

```http
POST /functions/v1/add-to-library
```

Payload:

```json
{
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
}
```

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

## 6. Reading

### 6.1 Iniciar leitura

```http
POST /functions/v1/start-reading
```

```json
{
  "userBookId": "20000000-0000-0000-0000-000000000001",
  "format": "physical",
  "totalUnits": 300
}
```

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

Formatos aceitos: `physical`, `ebook`, `audiobook`.

### 6.2 Atualizar progresso

O progresso é absoluto: `currentUnits` representa o novo valor desejado.

No seed, The Hobbit está em `120/300`:

```bash
curl -X PUT "$BASE_URL/update-reading-progress" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "readingId": "30000000-0000-0000-0000-000000000001",
    "currentUnits": 150
  }'
```

O backend rejeita redução de progresso e valores acima de `total_units`.

### 6.3 Consultar detalhes

```bash
curl "$BASE_URL/reading-details?readingId=30000000-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer $TOKEN"
```

### 6.4 Pausar

```bash
curl -X PUT "$BASE_URL/update-reading-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "readingId": "30000000-0000-0000-0000-000000000001",
    "status": "paused"
  }'
```

### 6.5 Retomar

```bash
curl -X PUT "$BASE_URL/update-reading-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "readingId": "30000000-0000-0000-0000-000000000001",
    "status": "reading"
  }'
```

### 6.6 Abandonar

```bash
curl -X PUT "$BASE_URL/update-reading-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "readingId": "30000000-0000-0000-0000-000000000001",
    "status": "abandoned"
  }'
```

## 7. Expedições

### 7.1 Listar

```bash
curl "$BASE_URL/expeditions" \
  -H "Authorization: Bearer $TOKEN"
```

### 7.2 Criar

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

Tipos de objetivo: `books_completed`, `pages_read`, `minutes_listened`.

### 7.3 Aplicar progresso

```bash
curl -X PUT "$BASE_URL/update-expedition-progress" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userExpeditionId": "70000000-0000-0000-0000-000000000001",
    "amount": 20,
    "source": "manual_test",
    "sourceReference": "qa:manual:1",
    "idempotencyKey": "qa:manual:expedition:1"
  }'
```

A mesma `idempotencyKey` não deve criar um segundo incremento.

### 7.4 Cancelar

```bash
curl -X PUT "$BASE_URL/cancel-expedition" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userExpeditionId": "70000000-0000-0000-0000-000000000001"
  }'
```

## 8. Descobertas

### 8.1 Catálogo

```bash
curl "$BASE_URL/achievements" \
  -H "Authorization: Bearer $TOKEN"
```

### 8.2 Conquistas da pessoa usuária

```bash
curl "$BASE_URL/user-achievements" \
  -H "Authorization: Bearer $TOKEN"
```

## 9. Mapa

```bash
curl "$BASE_URL/map" \
  -H "Authorization: Bearer $TOKEN"
```

No seed atual, o mapa QA começa com estados conhecidos para os nós iniciais.

## 10. Fluxos úteis

### 10.1 Descobrir um livro e iniciar a aventura

```text
books-search
    ↓
book-details
    ↓
add-to-library
    ↓
start-reading
    ↓
update-reading-progress
    ↓
reading-details
```

### 10.2 Avançar até concluir

Para o fixture do Hobbit, a leitura é `120/300`:

```bash
curl -X PUT "$BASE_URL/update-reading-progress" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "readingId": "30000000-0000-0000-0000-000000000001",
    "currentUnits": 300
  }'
```

Ao atingir o total, a Reading é concluída e o UserBook relacionado também passa para `completed`. A jornada emite os eventos de domínio que alimentam os efeitos de XP, Descobertas, Expedições e Mapa aplicáveis.

## 11. Reset do cenário

Os fixtures são determinísticos:

```bash
deno task seed:qa
```

O script de seed executa um reset do banco local antes de reaplicar o QA seed.

## 12. Resumo dos endpoints

| Método | Endpoint | Auth | Finalidade |
| --- | --- | --- | --- |
| GET | `/books-search?q=...` | não | Buscar livros |
| GET | `/book-details?id=...` | não | Detalhar livro |
| POST | `/add-to-library` | sim | Adicionar livro |
| POST | `/start-reading` | sim | Iniciar aventura |
| PUT | `/update-reading-progress` | sim | Atualizar progresso |
| PUT | `/update-reading-status` | sim | Pausar, retomar ou abandonar |
| GET | `/reading-details?readingId=...` | sim | Consultar leitura |
| GET | `/achievements` | sim | Listar descobertas |
| GET | `/user-achievements` | sim | Listar descobertas da pessoa |
| GET | `/expeditions` | sim | Listar expedições |
| POST | `/create-expedition` | sim | Criar expedição |
| PUT | `/update-expedition-progress` | sim | Aplicar progresso |
| PUT | `/cancel-expedition` | sim | Cancelar expedição |
| GET | `/map` | sim | Consultar mapa |

## 13. Documentação relacionada

- `README.md`: instalação, tarefas e operação local.
- `docs/TECH-DOC.md`: arquitetura, domínio e decisões técnicas.
- `supabase/seeds/README.md`: fixtures e bootstrap do ambiente QA.
