# Avanum Backend — QA Playbook

Este documento cobre somente o fluxo de QA do backend. Pré-requisitos, configuração do ambiente, comandos de desenvolvimento e execução das funções estão centralizados no `README.md`.

## 1. Objetivo

O QA deve permitir validar alterações de forma reproduzível, usando o ambiente local determinístico e os cenários definidos para cada domínio.

A validação combina:

- suíte automatizada;
- fixtures determinísticos;
- validações manuais de integração quando necessárias;
- checagem de ownership, estados inválidos e idempotência.

## 2. Cenário oficial de QA

O ambiente oficial usa o usuário e os fixtures definidos em:

`supabase/seeds/README.md`

Para preparar ou restaurar o cenário, siga o setup descrito no `README.md`.

Os IDs documentados nos fixtures são locais e não devem ser usados como identificadores do ambiente remoto.

## 3. Suíte automatizada

A validação mínima de regressão é:

```bash
deno task test
```

Quando a alteração estiver restrita a um domínio, pode-se executar a task correspondente antes da suíte completa:

```bash
deno task test:reading
deno task test:map
deno task test:xp
```

O CI executa a suíte completa.

## 4. Validações manuais

As validações abaixo devem ser executadas quando a alteração afetar o comportamento das Edge Functions, contratos ou integrações.

### 4.1 Book Catalog

Validar:

- busca retorna o contrato próprio do Avanum;
- detalhes do livro são retornados corretamente;
- ausência de metadados opcionais não quebra a resposta;
- provider externo não é exposto ao contrato do frontend.

Os exemplos de chamadas estão em `docs/API-LOCAL.md`.

### 4.2 Biblioteca

Validar:

- autenticação obrigatória;
- livro persistido corretamente;
- relação com o usuário autenticado;
- tentativa de duplicação tratada corretamente;
- usuário não acessa biblioteca de outra pessoa.

### 4.3 Reading

Validar o fluxo principal:

```text
start-reading
    ↓
update-reading-progress
    ↓
reading-details
    ↓
update-reading-status
```

Verificar:

- ownership;
- formato válido;
- total positivo;
- criação da Reading;
- sincronização com UserBook;
- progresso não diminui;
- progresso não ultrapassa o total;
- conclusão automática ao atingir o total;
- transições válidas de status;
- estados encerrados não retornam ao fluxo ativo.

### 4.4 XP

Validar:

- início de leitura concede a recompensa esperada;
- novos marcos de 10% não são duplicados;
- conclusão concede a recompensa esperada;
- pausar, retomar e abandonar não concedem XP;
- repetir a mesma operação não duplica a concessão.

### 4.5 Descobertas

Validar:

- catálogo ativo disponível;
- primeira leitura pode desbloquear a descoberta correspondente;
- conclusão de leitura pode avaliar descobertas elegíveis;
- descoberta já concedida não é duplicada;
- critérios são calculados pelo backend;
- usuário só consulta suas próprias conquistas.

### 4.6 Expedições

Quando a alteração afetar Expedições, validar:

- criação;
- consulta;
- aplicação de progresso;
- conclusão;
- cancelamento;
- ownership;
- idempotência de atualizações repetidas.

### 4.7 Mapa

Quando a alteração afetar o Mapa, validar:

- consulta autenticada;
- ownership;
- estado esperado dos nós do fixture;
- atualização causada pelos eventos relevantes do domínio.

## 5. Regressão e reprodução

Ao detectar uma falha:

1. restaurar o cenário determinístico de QA usando o procedimento oficial do `README.md`;
2. reproduzir o fluxo com os mesmos dados;
3. confirmar a falha;
4. corrigir;
5. executar novamente o teste automatizado;
6. repetir a validação manual relevante.

O objetivo é evitar que a correção dependa de estado residual do ambiente local.

## 6. Checklist antes do PR

- [ ] Suíte relevante passando localmente.
- [ ] `deno task test` passando quando houver mudança compartilhada.
- [ ] Migrations válidas em ambiente limpo.
- [ ] Fixtures QA carregadas.
- [ ] Fluxo manual relevante validado.
- [ ] RLS/ownership considerado.
- [ ] Idempotência considerada para operações repetíveis.
- [ ] Estados inválidos e transições proibidas considerados.
- [ ] Nenhum secret commitado.
- [ ] Documentação de contrato atualizada quando necessário.

## 7. CI

O CI é a última camada de regressão antes do merge e deve permanecer consistente com os comandos oficiais do projeto.

Fluxo:

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

Uma falha em qualquer etapa deve bloquear a validação do PR.

## 8. Critério de aceite

Uma alteração é considerada validada quando:

- os testes automatizados passam;
- os cenários manuais relevantes passam;
- ownership e regras de segurança foram verificados quando aplicáveis;
- idempotência foi verificada nas operações repetíveis;
- o cenário pode ser reproduzido a partir dos fixtures oficiais;
- o CI termina com sucesso.
