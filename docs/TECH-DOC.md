# Avanum — Technical Design Document (MVP)

**Versão 1.4 · Estado técnico consolidado após Book Catalog, Reading, XP e Descobertas**

## 1. Visão técnica

Avanum é um diário de leitura gamificado no qual a pessoa usuária é a **Exploradora** e Elora é sua guia pelo mundo de Avanum.

O MVP prevê descoberta de livros, biblioteca pessoal, início e acompanhamento de leituras em diferentes formatos, pausa, retomada, abandono e conclusão, além de XP, descobertas, expedições pessoais, mapa e estatísticas.

O backend do MVP está sendo desenvolvido separadamente do frontend. O repositório `avanum-backend` concentra Supabase, migrations, RLS, Edge Functions e regras de domínio server-side.

### Objetivos técnicos

- Entregar uma base mobile-first/PWA no produto final.
- Manter o domínio desacoplado do fornecedor de catálogo.
- Persistir biblioteca e jornada de leitura.
- Centralizar regras de negócio em serviços/Edge Functions e RPCs transacionais.
- Usar PostgreSQL como fonte de verdade dos dados persistidos.
- Permitir evolução futura da arquitetura sem acoplar o domínio a um provider externo.

## 2. Princípios arquiteturais

- **Book Catalog é uma capacidade própria do Avanum**, mesmo usando Google Books como provider no MVP.
- Google Books é fonte de descoberta/metadados; o PostgreSQL do Avanum é a fonte de verdade para dados persistidos e comportamento da pessoa usuária.
- O frontend não depende do payload da Google Books API.
- Dados de catálogo e dados de leitura são responsabilidades distintas.
- O total usado para progresso é configurado pela pessoa usuária e não depende do `pageCount` retornado pelo catálogo.
- Gamificação reforça a leitura, não compete com ela.
- A pessoa usuária é a protagonista; Elora é a guia.
- CRUD e consultas simples podem usar Supabase SDK + RLS.
- Regras de negócio, transações e integrações externas devem ficar em Edge Functions e RPCs apropriadas.
- Triggers SQL são usados somente como reação a eventos de domínio bem definidos; a validação e a concessão de efeitos permanecem centralizadas em funções de domínio idempotentes.

## 3. Repositórios e responsabilidades

Frontend e backend são mantidos em repositórios separados.

| Repositório | Responsabilidade |
|---|---|
| `avanum-web` | React, Vite, TypeScript, PWA e interface do produto |
| `avanum-backend` | Supabase, PostgreSQL, migrations, RLS, Edge Functions e regras de negócio |

Essa separação permite desenvolver e validar backend e frontend em etapas independentes.

## 4. Arquitetura do backend MVP

```text
avanum-web
   │
   ├── Supabase Auth
   │
   ├── Supabase SDK ─────────────── PostgreSQL + RLS
   │
   └── Edge Functions ───────────── regras de negócio
                                      │
                                      ├── PostgreSQL / RPCs
                                      │
                                      └── Book Catalog
                                             │
                                             └── Google Books API
```

### Motivação

- Menor infraestrutura para operar durante o MVP.
- PostgreSQL adequado ao domínio relacional.
- Auth e autorização entregues pelo Supabase.
- Edge Functions preservam uma camada server-side para secrets, integrações e regras transacionais.
- A arquitetura pode ser reavaliada se o produto ganhar escala ou complexidade suficientes para justificar um backend dedicado.

## 5. Book Catalog

O frontend não chama Google Books diretamente.

O backend possui uma camada própria de catálogo com:

- `BookCatalogService` como serviço de domínio/catalogação.
- `GoogleBooksClient` para integração com o provider.
- `GoogleBooksMapper` para transformar o payload externo no contrato do Avanum.
- Edge Functions `books-search` e `book-details` como entrada server-side.

### Provider do MVP

**Google Books API é o único provider do MVP.**

Open Library foi avaliada durante a descoberta técnica, mas não será utilizada como fallback no MVP. A abstração do catálogo permanece preparada para uma futura inclusão de provider sem alterar o contrato consumido pelo frontend.

### Operações externas

| Operação | Provider |
|---|---|
| Buscar volumes | Google Books `GET /books/v1/volumes` |
| Obter volume | Google Books `GET /books/v1/volumes/{id}` |

A API key do Google Books permanece somente no backend como secret.

### Contrato de Book

```text
id             string
external_id    string
title          string
authors        string[]
synopsis       string?
cover_url      string?
publication_year integer?
categories     string[]
language       string?
isbn10         string?
isbn13         string?
```

Campos de avaliação (`averageRating`/`ratingsCount`) são opcionais no provider e não são exibidos no MVP.

O `pageCount` do provider não é fonte de verdade para a jornada de leitura.

## 6. Persistência

O banco do MVP utiliza PostgreSQL gerenciado pelo Supabase.

### 6.1 `books`

Representa o livro global no catálogo do Avanum.

Principais campos:

- `id` — UUID interno.
- `external_id` — identificador único do provider.
- `title`.
- `authors`.
- `synopsis`.
- `cover_url`.
- `publication_year`.
- `categories`.
- `language`.
- `isbn10` / `isbn13`.
- `created_at` / `updated_at`.

`external_id` possui constraint de unicidade.

### 6.2 `user_books`

Representa a relação entre pessoa usuária e livro.

```text
user_id
book_id
status
created_at
updated_at
```

Estados persistidos:

```text
want_to_read
reading
paused
abandoned
completed
```

A relação `(user_id, book_id)` é única para impedir duplicação na biblioteca.

### 6.3 `readings`

Representa uma aventura de leitura iniciada.

```text
id
user_book_id
format
total_units
current_units
status
started_at
paused_at
completed_at
created_at
updated_at
```

Formatos:

```text
physical
ebook
audiobook
```

Estados:

```text
reading
paused
abandoned
completed
```

Restrições atuais:

- `total_units > 0`.
- `current_units >= 0`.
- `current_units <= total_units`.
- Um `UserBook` pode possuir no máximo uma leitura ativa nos estados `reading` ou `paused`.

A tabela possui índice por `user_book_id` e índice único parcial para a leitura ativa.

### 6.4 `user_xp`

Representa o saldo acumulado de XP da pessoa usuária.

```text
user_id
 total_xp
created_at
updated_at
```

`user_id` é a chave primária e referencia `auth.users`.

### 6.5 `xp_transactions`

Representa o histórico auditável de concessões de XP.

```text
id
user_id
amount
source
source_reference
idempotency_key
created_at
```

`idempotency_key` é único para impedir concessões duplicadas.

### 6.6 `achievements`

Representa o catálogo de Descobertas disponíveis no produto.

```text
id
code
name
description
trigger
threshold
metadata
active
created_at
updated_at
```

`code` é único. `trigger` identifica o tipo de evento que pode desbloquear a descoberta e `threshold` representa o marco necessário.

### 6.7 `user_achievements`

Representa as Descobertas conquistadas por cada pessoa usuária.

```text
id
user_id
achievement_id
source_reference
achieved_at
```

A combinação `(user_id, achievement_id)` é única, garantindo que uma descoberta só possa ser conquistada uma vez.

## 7. Domínio de leitura

### 7.1 Início de leitura

A criação de uma `Reading` é uma operação de negócio e é realizada por Edge Function.

Endpoint atual:

```http
POST /functions/v1/start-reading
```

Payload:

```json
{
  "userBookId": "ID_DO_USER_BOOK",
  "format": "physical",
  "totalUnits": 300
}
```

Regras:

1. Autenticação obrigatória.
2. `userBookId` deve pertencer à pessoa autenticada.
3. O formato deve ser `physical`, `ebook` ou `audiobook`.
4. `totalUnits` deve ser inteiro positivo.
5. Livros `completed` ou `abandoned` não podem ser iniciados novamente.
6. Não pode existir outra Reading ativa ou pausada para o mesmo `UserBook`.
7. A Reading é criada com `current_units = 0` e `status = reading`.
8. O `UserBook` é atualizado para `reading`.
9. A pessoa recebe `+10 XP` com chave de idempotência vinculada à Reading.
10. O evento `reading_started` é avaliado para Descobertas.

A operação utiliza a função PostgreSQL `start_reading(...)` com `security definer`, controle de ownership e execução restrita ao `service_role`.

### 7.2 Atualização de progresso

Endpoint atual:

```http
PUT /functions/v1/update-reading-progress
```

Payload:

```json
{
  "readingId": "ID_DA_READING",
  "currentUnits": 50
}
```

O progresso é **absoluto e idempotente**: o valor enviado representa o novo progresso desejado.

Regras:

- Apenas leituras em `reading` podem receber progresso.
- O progresso não pode diminuir.
- O progresso não pode ultrapassar `total_units`.
- Ao atingir `total_units`, a Reading é automaticamente concluída.
- Na conclusão automática, `completed_at` é preenchido.
- O `UserBook` também passa para `completed`.
- Reading, UserBook e efeitos de gamificação aplicáveis são processados na mesma transação.
- Cada novo marco de 10% atravessado concede `+5 XP` uma única vez.
- A conclusão concede `+50 XP` uma única vez.
- A conclusão gera a avaliação das Descobertas de livros concluídos.

A operação utiliza `update_reading_progress(...)` no PostgreSQL.

Quando uma atualização salta vários marcos de 10%, todos os marcos atravessados são concedidos.

Para audiobook, o valor de progresso representa unidades de tempo configuradas pela jornada; no incremento atual o backend trabalha com inteiros e não persiste uma coluna separada de unidade.

### 7.3 Pausar, retomar e abandonar

Endpoint atual:

```http
PUT /functions/v1/update-reading-status
```

Payload:

```json
{
  "readingId": "ID_DA_READING",
  "status": "paused"
}
```

Transições permitidas:

```text
reading ──→ paused
reading ──→ abandoned
paused  ──→ reading
paused  ──→ abandoned
```

Regras:

- Pausar preserva o progresso e registra `paused_at`.
- Retomar remove `paused_at` e volta o status para `reading`.
- Abandonar encerra a aventura sem apagar o histórico.
- Uma leitura `completed` não pode mudar de status.
- Uma leitura `abandoned` não pode mudar de status.
- Solicitar o mesmo status atual é rejeitado.
- O `UserBook` permanece sincronizado com o estado da Reading.
- Pausar, retomar e abandonar não concedem XP.

A operação utiliza `update_reading_status(...)` no PostgreSQL.

### 7.4 Consulta de leitura

Endpoint atual:

```http
GET /functions/v1/reading-details
```

A consulta retorna a leitura pertencente à pessoa autenticada, incluindo os dados necessários para exibir a aventura e seu contexto de livro/biblioteca.

Ownership é validado server-side e uma leitura de outra pessoa não pode ser consultada.

### 7.5 Conclusão

A conclusão ocorre quando `current_units` atinge `total_units` durante uma atualização de progresso.

O fluxo concluído atualmente é:

```text
update-reading-progress
        ↓
Reading → completed
UserBook → completed
        ↓
+50 XP
        ↓
avaliação de books_completed
        ↓
Descobertas elegíveis
```

A operação mantém o estado da leitura e os efeitos de gamificação aplicáveis de forma consistente na mesma transação.

## 8. Domínio de XP

### Recompensas

| Evento | XP |
|---|---:|
| Iniciar leitura | +10 |
| Cada marco de 10% | +5 |
| Concluir leitura | +50 |
| Pausar / retomar / abandonar | +0 |

### Idempotência

Cada concessão utiliza uma chave determinística:

```text
reading:{reading_id}:started
reading:{reading_id}:progress:{milestone}
reading:{reading_id}:completed
```

Uma chave já utilizada não cria nova transação nem altera novamente o saldo.

### Atomicidade

A concessão de XP ocorre dentro das RPCs de jornada de leitura. Assim, a alteração de estado e o respectivo efeito de XP pertencem à mesma transação.

## 9. Domínio de Descobertas

### Modelo

`Achievement` representa uma descoberta disponível. `UserAchievement` representa a conquista efetiva por uma pessoa usuária.

### Cinco primeiras Descobertas

| Código | Nome | Trigger | Threshold |
|---|---|---|---:|
| `first_reading` | Primeira aventura | `reading_started` | 1 |
| `first_completion` | Primeiro destino | `books_completed` | 1 |
| `five_books_completed` | Caminho percorrido | `books_completed` | 5 |
| `ten_books_completed` | Leitora incansável | `books_completed` | 10 |
| `twenty_five_books_completed` | Grande exploradora | `books_completed` | 25 |

Essas cinco descobertas são o seed inicial do MVP.

### Avaliação

A avaliação é centralizada em `evaluate_achievements(...)`.

Para `reading_started`:

- `source_reference` é obrigatório.
- A referência deve apontar para uma Reading da própria pessoa usuária.
- O valor efetivo considera a quantidade real de leituras iniciadas.

Para `books_completed`:

- `source_reference` é obrigatório.
- A referência deve apontar para uma Reading concluída da própria pessoa usuária.
- O `UserBook` relacionado também precisa estar `completed`.
- O valor efetivo é calculado pela quantidade real de `user_books` concluídos.

O valor não é confiado ao cliente para evitar concessões artificiais.

### Idempotência

`user_achievements` possui unicidade por `(user_id, achievement_id)`. Conceder novamente uma descoberta existente não cria duplicata.

### Integração com a jornada

- Um trigger `AFTER INSERT` em `readings` reage ao início de uma leitura com status `reading`.
- Um trigger `AFTER UPDATE OF status` em `user_books` reage à mudança para `completed`.
- Os triggers apenas identificam o evento e delegam a avaliação à função de domínio.
- A função valida ownership, estado e referência antes de conceder qualquer descoberta.

Esse desenho permite adicionar novos critérios sem colocar regras específicas no frontend.

## 10. RLS e segurança

RLS permanece habilitado nas entidades de dados do usuário.

### `books`

- Usuários autenticados podem consultar livros.
- A criação/atualização do catálogo é responsabilidade do backend.

### `user_books`

- Acesso restrito ao próprio usuário.
- Ownership validado por `user_id`.

### `readings`

- Ownership é validado por meio do `user_book` relacionado.
- Leitura, criação e atualização ficam restritas à pessoa proprietária.

### `user_xp` e `xp_transactions`

- Usuários podem consultar apenas os próprios dados.
- Escritas diretas pelo cliente são bloqueadas.
- Concessões são feitas por RPC `security definer` com execução restrita a `service_role`.

### `achievements`

- Usuários autenticados podem consultar apenas descobertas ativas.
- Escritas diretas pelo cliente são bloqueadas.

### `user_achievements`

- Usuários podem consultar apenas suas próprias conquistas.
- Escritas diretas pelo cliente são bloqueadas.
- Concessões são feitas pelo domínio server-side.

### Edge Functions

As Edge Functions:

1. Recebem o JWT pelo header `Authorization`.
2. Validam o usuário usando Supabase Auth.
3. Utilizam `SUPABASE_ANON_KEY` no client autenticado.
4. Utilizam `SERVICE_ROLE_KEY` apenas no client administrativo server-side quando necessário.
5. Executam regras de negócio por serviços e RPCs.

`SERVICE_ROLE_KEY` nunca deve chegar ao frontend ou ser registrado em logs.

## 11. Padrão de transação e RPC

Operações que alteram múltiplas entidades ou exigem consistência utilizam funções PostgreSQL transacionais.

Padrão adotado:

```text
Edge Function
    ↓
Service
    ↓
PostgreSQL RPC (security definer)
    ↓
Atualização atômica das entidades
    ↓
Efeitos de domínio idempotentes
```

As RPCs possuem execução revogada de `public` e concedida ao `service_role`.

Triggers são usados apenas para eventos de domínio específicos de Descobertas e não substituem a validação centralizada das RPCs.

## 12. API atual do backend

A tabela abaixo representa o estado **implementado**, não apenas o desenho inicial do produto.

| Método | Edge Function | Responsabilidade |
|---|---|---|
| GET | `books-search` | Buscar livros |
| GET | `book-details` | Consultar detalhes |
| POST | `add-to-library` | Adicionar livro à biblioteca |
| POST | `start-reading` | Iniciar aventura e aplicar gamificação de início |
| PUT | `update-reading-progress` | Atualizar progresso, XP de marcos/conclusão e descobertas de conclusão |
| PUT | `update-reading-status` | Pausar, retomar ou abandonar |
| GET | `reading-details` | Consultar uma leitura |
| GET | `achievements` | Listar descobertas ativas |
| GET | `user-achievements` | Listar descobertas conquistadas pela pessoa autenticada |

Não existe endpoint público de concessão de XP ou Descobertas. Esses efeitos são disparados por regras de domínio server-side.

## 13. Convenções de resposta e validação

As Edge Functions atuais seguem uma estrutura simples de resposta JSON e validam método HTTP, autenticação e payload antes de executar a regra de negócio.

Erros de negócio conhecidos retornam códigos HTTP coerentes, incluindo:

- `400` para payload ou valor inválido.
- `401` para ausência/invalidade de autenticação.
- `404` quando a entidade não pertence ao usuário ou não existe.
- `405` para método HTTP não suportado.
- `409` para conflito de estado ou regra de domínio.
- `500` para erro interno não tratado como erro de negócio.

## 14. Testes e validação

O backend utiliza testes automatizados para serviços, mapeadores e domínios implementados.

Coberturas já implementadas incluem:

- GoogleBooksClient.
- GoogleBooksMapper.
- BookCatalogService.
- Add-to-library.
- Start-reading.
- Update-reading-progress.
- Update-reading-status.
- XPService.
- AchievementService.
- Fluxos de consulta de Descobertas.

### Validação remota concluída

Os fluxos de gamificação foram validados no ambiente remoto do Supabase, incluindo:

- Início de leitura com `+10 XP`.
- Proteção contra XP duplicado no início.
- Marcos de 10% com `+5 XP`.
- Avanço direto por múltiplos marcos.
- Conclusão com `+50 XP` além do marco de 100%.
- Pausar, retomar e abandonar sem XP.
- Consistência entre `user_xp` e `xp_transactions`.
- Primeira leitura gerando `Primeira aventura`.
- Primeira conclusão gerando `Primeiro destino`.
- `source_reference` validado.
- Tentativas artificiais de conceder Descobertas bloqueadas.
- Ausência de duplicatas em `user_achievements`.
- Endpoints `achievements` e `user-achievements` funcionando.

## 15. Observabilidade e hardening

A estratégia prevista para o MVP inclui:

- Logs estruturados.
- Métricas de sucesso, latência e erro do provider.
- Contagem de respostas `429` e `5xx`.
- Logs de falhas de normalização.
- Monitoramento de erros das Edge Functions.
- Nunca registrar API keys, tokens ou `SERVICE_ROLE_KEY`.
- Rate limiting para busca de livros.
- Validação consistente de ownership, progresso e efeitos de gamificação.

A etapa de observabilidade/hardening será consolidada após os principais domínios funcionais do MVP.

## 16. Mapa

O mapa representa visualmente a evolução da Exploradora.

- **Vila da Chegada** é o ponto inicial.
- Regiões podem estar bloqueadas, descobertas ou exploradas.
- Conclusões podem desbloquear regiões.
- Elora atua como guia.
- A estética deve ser editorial/ilustrada, sem transformar o produto em um RPG carregado.

As regras de desbloqueio ainda serão definidas antes da implementação do domínio de mapa.

## 17. Estatísticas e exportação

O MVP deverá suportar:

- Livros concluídos por período.
- Evolução mensal e anual.
- Progresso acumulado.
- Tempo de audiobook quando disponível.
- Gêneros/territórios explorados.
- Metas e expedições concluídas.
- Recordes pessoais.
- Exportação anual como imagem para compartilhamento.

## 18. ReadingSession

`ReadingSession` permanece como entidade futura/opcional.

O incremento atual não registra sessões individuais porque o domínio implementado trabalha com o progresso acumulado da Reading. A necessidade será reavaliada quando as estatísticas exigirem duração, sessões ou detalhamento temporal.

## 19. Frontend e contratos

O frontend deverá consumir contratos do Avanum, nunca payloads da Google Books.

Stack prevista para o frontend:

- React + Vite + TypeScript.
- Tailwind CSS.
- React Router.
- TanStack Query.
- Zod.
- React Hook Form.
- Vitest + Testing Library.
- Playwright.
- PWA/mobile-first.

A implementação do frontend ocorrerá em etapa separada da implementação do backend.

## 20. Identidade, Elora e linguagem

- A pessoa usuária é a Exploradora e protagonista.
- Elora é a guia.
- A Elora do onboarding é a referência visual canônica inicial.
- Variações futuras podem alterar pose/expressão, mas devem preservar identidade.
- Português brasileiro natural e contemporâneo.
- Evitar linguagem medieval, rebuscada ou excessivamente formal.
- Preferir `você`, `sua`, `está`, `ler`, `chegar`.

## 21. Estado atual da implementação

### Implementado

- Estrutura inicial do projeto Supabase.
- Configuração de Edge Functions.
- Integração com Google Books.
- GoogleBooksClient.
- GoogleBooksMapper.
- BookCatalogService.
- `books-search`.
- `book-details`.
- Tabela `books`.
- Tabela `user_books`.
- RLS e policies de catálogo/biblioteca.
- `add-to-library`.
- Autenticação via Supabase Auth no fluxo de biblioteca.
- Tabela `readings`.
- RLS de `readings`.
- `start-reading`.
- RPC `start_reading`.
- `update-reading-progress`.
- RPC `update_reading_progress`.
- `update-reading-status`.
- RPC `update_reading_status`.
- Pausa, retomada e abandono.
- Conclusão automática ao atingir o total configurado.
- `reading-details`.
- Domínio de XP com `user_xp` e `xp_transactions`.
- Idempotência e RLS de XP.
- XP integrado ao início, marcos de 10% e conclusão.
- Domínio de Descobertas com `achievements` e `user_achievements`.
- Seed das cinco primeiras Descobertas.
- Avaliação automática de Descobertas na jornada de leitura.
- Idempotência, `source_reference` e proteção contra concessões artificiais.
- `achievements` e `user-achievements`.

### Em definição

- Método final de progresso de e-book.
- Regras de desbloqueio do mapa.
- Necessidade de `ReadingSession`.
- Política de cache/atualização de metadados.
- Formato e implementação da exportação anual.
- Observabilidade/hardening final.

## 22. Roadmap técnico atualizado

A ordem considera o domínio já implementado e prioriza fechar a camada de gamificação antes de avançar para os próximos elementos do mundo.

1. **Expedições** — implementar metas pessoais de leitura. **Próximo card: ATSA-12.**
2. **Mapa** — implementar regiões, desbloqueios e estado de exploração. **ATSA-13.**
3. **Estatísticas** — consolidar dados mensais/anuais da jornada. **ATSA-14.**
4. **Exportação anual** — gerar imagem compartilhável das estatísticas. **ATSA-15.**
5. **Observabilidade, testes e hardening** — consolidar monitoramento, segurança, testes de integração e robustez. **ATSA-16.**

O frontend será desenvolvido em uma etapa separada, consumindo os contratos estabilizados do backend.

## 23. Critérios de sucesso técnico

- Buscar livro e adicionar à biblioteca.
- Iniciar leitura escolhendo formato e total de unidades.
- Persistir progresso de forma consistente.
- Pausar e abandonar produzem estados distintos e preservam histórico.
- Retomar uma leitura pausada restaura o estado de `reading` sem perder progresso.
- Atingir o total conclui Reading e UserBook atomicamente.
- Iniciar uma leitura concede `+10 XP` uma única vez.
- Cada marco de 10% concede `+5 XP` uma única vez.
- Concluir uma leitura concede `+50 XP` uma única vez.
- A primeira leitura e as quantidades de livros concluídos geram as Descobertas elegíveis.
- Descobertas não podem ser concedidas artificialmente nem duplicadas.
- Ownership impede acesso a dados de outra pessoa.
- Nenhuma credencial externa chega ao frontend.
- O domínio não depende do formato do payload Google Books.
- O backend mantém contratos próprios para o frontend.

## 24. ADR-001 — Stack e arquitetura do MVP

**Status: ACEITA**

Para o MVP, Avanum prioriza baixa complexidade operacional, velocidade de implementação e manutenção simples.

### Frontend

React + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query, Zod, React Hook Form, Vitest + Testing Library, Playwright e PWA.

### Backend

Supabase como backend gerenciado, com PostgreSQL, Supabase Auth, RLS e Edge Functions. Não será criada uma API Rails/NestJS no MVP.

CRUD e consultas simples podem usar SDK + RLS. Regras de negócio, transações e integrações externas ficam em Edge Functions.

### Trade-offs

- Maior dependência da plataforma Supabase durante o MVP.
- Parte da aplicação acessará dados diretamente via SDK.
- RLS e policies precisam permanecer bem testadas.
- Fronteiras entre CRUD simples e regras de negócio devem ser respeitadas.

## 25. ADR-002 — Persistência de catálogo e biblioteca

**Status: ACEITA**

O catálogo de livros é persistido no PostgreSQL do Supabase, separando o livro global do relacionamento com cada usuário.

- `books` representa o livro no catálogo e utiliza `external_id` como identificador único do provider.
- `user_books` representa a relação entre usuário e livro.
- Um mesmo Book pode ser compartilhado por vários usuários.
- `user_books` possui status `want_to_read`, `reading`, `paused`, `abandoned` e `completed`.
- RLS restringe dados relacionados à biblioteca ao próprio usuário.
- `add-to-library` autentica o usuário antes de executar persistência privilegiada.
- `SERVICE_ROLE_KEY` existe somente no ambiente server-side.

## 26. ADR-003 — Domínio de Reading e operações transacionais

**Status: ACEITA**

A jornada de leitura foi implementada como domínio próprio, separado do catálogo.

Decisões:

- `Reading` possui `format`, `total_units` e `current_units`.
- O total é configurado pela pessoa usuária.
- Uma Reading ativa ou pausada é permitida por `UserBook`.
- Início, atualização de progresso e mudança de status são operações de negócio expostas por Edge Functions.
- Atualizações de domínio que envolvem Reading e UserBook utilizam RPCs PostgreSQL transacionais.
- Progresso é absoluto e não pode diminuir.
- Atingir o total conclui automaticamente Reading e UserBook.
- Pausar, retomar e abandonar são transições explícitas e distintas.
- Leituras concluídas ou abandonadas não podem voltar ao fluxo ativo.

## 27. ADR-004 — Gamificação integrada ao domínio de Reading

**Status: ACEITA**

XP e Descobertas são efeitos de domínio da jornada de leitura e não operações livres expostas ao frontend.

### XP

- Iniciar leitura concede `+10 XP`.
- Cada novo marco de 10% concede `+5 XP`.
- Concluir leitura concede `+50 XP`.
- Pausar, retomar e abandonar não concedem XP.
- Chaves determinísticas de idempotência impedem duplicidade.
- A concessão ocorre dentro das RPCs transacionais da jornada.

### Descobertas

- O catálogo inicial contém cinco descobertas seedadas.
- `first_reading` é avaliada no início de uma Reading.
- `books_completed` é avaliada quando uma leitura é efetivamente concluída.
- O número de livros concluídos é calculado no banco, não confiado ao cliente.
- `source_reference` vincula a conquista ao evento de origem.
- `(user_id, achievement_id)` é único.
- A concessão é protegida por funções `security definer` e `service_role`.
- Os triggers de Reading/UserBook apenas detectam eventos e delegam a avaliação ao domínio de Descobertas.

Essa decisão mantém o frontend responsável pela apresentação e o backend responsável pela integridade da progressão.

## 28. Convenções de desenvolvimento

O projeto adota o seguinte fluxo:

1. Definir a próxima etapa.
2. Criar/revisar card no Jira.
3. Usar o ID do card como nome da branch.
4. Implementar no repositório correspondente.
5. Executar testes locais.
6. Validar em ambiente remoto quando aplicável.
7. Abrir PR com o ID do Jira no início do título: `[ATSA-ID] ...`.
8. Manter descrição de cards e PRs em português.
9. Solicitar revisão.
10. Fazer merge após aprovação.
11. Finalizar o card.
12. Atualizar esta documentação quando houver mudança arquitetural ou de contrato.

## 29. Vocabulário

| Termo | Significado |
|---|---|
| Exploradora | Pessoa usuária; protagonista de Avanum |
| Elora | Guia de Avanum |
| Aventura | Uma leitura iniciada |
| Biblioteca | Coleção pessoal de livros |
| Reading | Registro técnico da aventura de leitura |
| UserBook | Relação entre usuário e livro |
| Descoberta | Conquista desbloqueada |
| Expedição | Meta pessoal de leitura |
| Território/Região | Parte do mapa desbloqueada |
| Jornada | Visão principal do progresso |

---

**Documento técnico do Avanum MVP — versão 1.4**
