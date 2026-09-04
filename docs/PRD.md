# Avanum — Product Requirements Document (MVP)

**PRD v1.0 · Documento de produto consolidado**

## 1. Visão do produto

Avanum é um diário de leitura gamificado que transforma o hábito de ler em uma jornada de exploração. A pessoa usuária é a Exploradora e Elora é sua guia pelo mundo de Avanum.

A proposta não é transformar leitura em um jogo que compete com o livro. A gamificação deve tornar visível, prazerosa e memorável a evolução da pessoa leitora.

### Proposta de valor

- Registrar o que já foi lido.
- Acompanhar livros em andamento.
- Guardar próximos livros na lista Quero ler.
- Acompanhar progresso físico, digital e em audiobook.
- Pausar ou abandonar leituras sem perder o histórico.
- Criar metas e expedições pessoais.
- Visualizar evolução mensal e anual.
- Transformar progresso de leitura em descobertas no mapa de Avanum.

## 2. Conceito e universo

Avanum é um mundo de exploração literária. A leitura é apresentada como uma jornada por territórios, regiões e descobertas.

## 3. Princípios de experiência

- O livro é o protagonista; a gamificação é a camada de motivação.
- A experiência deve ser acolhedora, curiosa e exploratória.
- O mapa representa evolução, não apenas níveis.
- A pessoa deve entender facilmente o que pode fazer a seguir.
- Ações de leitura devem ter consequências visíveis no mundo de Avanum.
- Pausar e abandonar são estados diferentes.
- A experiência deve funcionar muito bem em mobile.
- O produto deve parecer um diário de leitura com alma de aventura, e não um RPG genérico.

## 4. Identidade e direção visual

### Tema

Dark, suave e inspirado em bibliotecas antigas, livros, mapas e exploração. O tema light pode ser considerado em uma fase futura.

### Direção visual

- Atmosfera de biblioteca antiga + mapas de exploração.
- Paleta escura, confortável e elegante.
- Ilustrações com sensação artesanal/editorial.
- Mapa como elemento visual central.
- Evitar estética infantil, neon ou RPG excessivamente carregado.
- Manter leitura e acessibilidade como prioridades.

### Elora

- Mesma identidade visual da personagem em todo o produto.
- A Elora do onboarding é a referência canônica inicial.
- Elora é guia, não avatar da pessoa.
- Variações futuras podem mudar expressão/pose, mas devem manter identidade consistente.

## 5. Voz e linguagem

- Português brasileiro natural e contemporâneo.
- Tom acolhedor, curioso, aventureiro e próximo.
- Frases simples e conversacionais.
- Usar você/sua/está/ler/chegar.
- Evitar tu/tua/estás/leres/chegares.
- Evitar linguagem medieval, rebuscada ou excessivamente formal.
- Elora conversa com a pessoa; não fala como narradora distante.

## 6. Navegação principal

A navegação principal usa bottom navigation no mobile. Em telas maiores pode ser adaptada para sidebar.

## 7. Jornada / Home

A Jornada é a tela principal e deve responder rapidamente: **“Onde estou na minha aventura?”**

Deve apresentar:

- Saudação e presença da Elora.
- Livro ou livros em andamento.
- Progresso atual.
- Próxima meta/expedição relevante.
- Resumo de evolução.
- Acesso visual ao mapa.
- Descobertas recentes.
- Atalhos para continuar uma leitura ou explorar livros.

A Home deve privilegiar continuidade: a pessoa deve conseguir retomar uma leitura sem procurar muito.

## 8. Explorar livros

A pessoa não cadastra livros manualmente. O catálogo é consultado por meio da Google Books API.

- Buscar por título, autor ou termos.
- Apresentar capa, título e autor nos resultados.
- Abrir detalhes do livro.
- Permitir adicionar à lista Quero ler.
- Permitir iniciar uma aventura diretamente.
- Tratar resultados sem capa, sinopse ou outros metadados sem quebrar a experiência.

### Detalhes do livro

- Capa.
- Título.
- Autor(es).
- Sinopse.
- Ano de publicação.
- Categorias/gêneros quando disponíveis.
- Identificadores úteis, sem transformar ISBN em informação central da experiência.
- Avaliação não é exibida no MVP por baixa consistência observada nos testes.

## 9. Biblioteca

A Biblioteca organiza o acervo pessoal.

A interface deve diferenciar visualmente estado atual, progresso e ações disponíveis.

## 10. Iniciar uma aventura

Adicionar um livro à biblioteca não significa começar a leitura. Iniciar uma aventura é uma decisão separada.

Fluxo:

1. Abrir detalhes do livro.
2. Selecionar **Começar aventura**.
3. Escolher o formato.
4. Configurar o método de progresso.
5. Informar páginas ou duração quando necessário.
6. Iniciar a leitura.

### Formatos

- Livro físico.
- E-book.
- Audiobook.

## 11. Progresso de leitura

O progresso deve ser simples de atualizar e persistente.

- Mostrar percentual.
- Mostrar unidade relevante: página, porcentagem ou tempo.
- Permitir atualização rápida.
- Atualizar Jornada e Biblioteca.
- Permitir concluir a leitura.
- Não depender do número de páginas retornado pelo catálogo.

O `pageCount` da API externa é metadado e não define o total usado pela pessoa. O mesmo vale para duração de audiobook.

## 12. Pausar e abandonar

### Pausar

Pausar significa: **“continuo lendo este livro, mas ele não é meu foco agora”**. O progresso e histórico permanecem.

### Abandonar

Abandonar significa encerrar a aventura sem concluir. O histórico não é apagado.

Esses estados não devem compartilhar o mesmo significado nem a mesma ação.

## 13. Conclusão de leitura

Ao concluir uma aventura, o produto deve criar um pequeno momento de recompensa:

- Confirmação de conclusão.
- Celebração visual.
- XP recebido.
- Descoberta/conquista, quando aplicável.
- Atualização do mapa.
- Livro movido para Concluídos.
- Atualização das estatísticas.
- Possibilidade futura de adicionar nota/reflexão.

## 14. Gamificação

### Objetivo

Criar sensação de progresso e descoberta sem transformar leitura em competição.

### XP

- Ganhar XP por ações significativas.
- Evitar farming por ações repetitivas.
- Conclusão deve ser uma recompensa importante.
- XP deve contribuir para evolução no mundo.

### Descobertas

Marcos da jornada que podem desbloquear elementos do mundo, regiões, conquistas ou momentos com Elora.

### Expedições

Metas pessoais de leitura, como quantidade de livros, determinado período ou objetivo temático. O MVP não possui desafios coletivos.

### Mapa

O mapa materializa a evolução. Novas leituras e conquistas podem abrir caminhos ou regiões.

## 15. Estatísticas

- Livros concluídos.
- Evolução mensal.
- Evolução anual.
- Páginas ou progresso acumulado.
- Tempo de audiobook quando disponível.
- Gêneros/territórios explorados.
- Metas e expedições concluídas.
- Recordes pessoais.

### Exportação

Permitir gerar uma imagem anual com as principais estatísticas para compartilhamento em redes sociais.

## 16. Notas e diário

Notas são desejáveis para o conceito de diário de leitura, mas não precisam ser centrais no primeiro incremento técnico.

- Permitir futuramente registrar impressões.
- Associar notas a uma leitura.
- Permitir registrar momentos ou trechos marcantes sem transformar o MVP em editor complexo.

## 17. Catálogo de livros

**Provider inicial: Google Books API.**

Open Library foi avaliada e considerada tecnicamente viável, mas não será usada como fallback no MVP.

Motivo: Google Books apresentou melhor retorno nos testes e maior conveniência por fornecer no payload de busca os principais dados necessários. Open Library exigiria chamadas adicionais para alguns detalhes e apresentou menor consistência de sinopses/idioma.

A aplicação possui sua própria API de Book Catalog. O frontend não consome Google Books diretamente.

## 18. Fluxos principais

### Descobrir → Quero ler

Explorar → Buscar livro → Abrir detalhes → Selecionar Quero ler → Livro aparece em Biblioteca → Quero ler.

### Descobrir → Começar aventura

Abrir detalhes → Começar aventura → Escolher formato → Configurar progresso → Iniciar.

### Ler → Pausar

Abrir leitura → Selecionar pausar → Confirmar → Livro aparece em Pausados.

### Ler → Abandonar

Abrir leitura → Selecionar abandonar → Confirmar → Livro aparece em Abandonados e histórico é preservado.

### Ler → Concluir

Atualizar progresso → Concluir → Celebrar → Receber XP → Atualizar descoberta/mapa → Mover para Concluídos.

## 19. Requisitos funcionais do MVP

- **RF01** — Pesquisar livros por termos.
- **RF02** — Abrir detalhes de um livro.
- **RF03** — Adicionar um livro à lista Quero ler.
- **RF04** — Iniciar uma aventura.
- **RF05** — Escolher entre livro físico, e-book e audiobook.
- **RF06** — Configurar o método de progresso.
- **RF07** — Atualizar o progresso.
- **RF08** — Pausar uma aventura.
- **RF09** — Retomar uma aventura pausada.
- **RF10** — Abandonar uma aventura sem apagar seu histórico.
- **RF11** — Concluir uma aventura.
- **RF12** — Atualizar XP e elementos de gamificação na conclusão.
- **RF13** — Visualizar evolução no mapa.
- **RF14** — Visualizar estatísticas de leitura.
- **RF15** — Criar e acompanhar expedições pessoais.
- **RF16** — Exportar estatísticas anuais como imagem.

## 20. Requisitos não funcionais

- **RNF01** — Experiência mobile-first.
- **RNF02** — Dark theme como padrão no MVP.
- **RNF03** — Interface responsiva.
- **RNF04** — Estados de loading, erro e vazio devem ser tratados.
- **RNF05** — Dados da pessoa devem ser privados por padrão.
- **RNF06** — A experiência deve continuar utilizável mesmo quando metadados opcionais de um livro estiverem ausentes.
- **RNF07** — A API de catálogo deve esconder detalhes do provider externo.
- **RNF08** — A aplicação deve preservar o progresso entre sessões.

## 21. Fora do MVP

- Open Library como fallback.
- Rede social.
- Seguidores.
- Rankings.
- Desafios coletivos.
- Tema light.
- Personalização avançada da Exploradora.
- Cosméticos/loja.
- Recomendação por IA.
- Integrações com plataformas de audiobook.
- Gerenciamento avançado de edições.
- Sistema complexo de notas.

## 22. Métricas de sucesso

- Percentual de usuários que adicionam um livro após uma busca.
- Percentual que inicia uma leitura após adicionar.
- Quantidade de leituras retomadas.
- Taxa de conclusão.
- Uso de metas/expedições.
- Frequência de retorno à Jornada.
- Interações com mapa e descobertas.
- Satisfação percebida com a sensação de progresso.

## 23. Critérios de aceite do MVP

O MVP deve permitir encontrar um livro real pela busca e visualizar seus detalhes, adicioná-lo a Quero ler, iniciar uma leitura com formato escolhido, atualizar seu progresso, pausar, retomar, abandonar ou concluir a aventura, além de refletir a evolução nos elementos de gamificação, mapa e estatísticas previstos para o produto.

## 24. Estado do produto

O PRD representa a visão funcional do MVP. A implementação do backend é feita separadamente do frontend, permitindo validar cada camada em etapas independentes. O Tech Doc deve ser atualizado quando decisões técnicas alterarem contratos, persistência ou arquitetura.
