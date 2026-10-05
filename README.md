# Orbit

Um MVP de produtividade para universitários: encontre o que estudar agora, reserve tempo e ajuste a rota quando precisar.

## Rodar

Pré-requisito: Node.js 22.12+ (ou 20.19+) e pnpm 11.

```sh
pnpm install
pnpm dev
```

Abra http://127.0.0.1:5173. Também é possível usar `npm install` e `npm run dev`; o lockfile oficial deste projeto é o do pnpm.

```sh
pnpm test
pnpm build
pnpm preview
```

## O MVP

- Hoje: recomendação, rota que cabe no tempo reservado, viabilidade e prazos em risco.
- To-do: criar, editar, concluir, reabrir e excluir tarefas; pesquisar e filtrar por matéria/status.
- Matérias: nome e cor discreta de identificação.
- Radar: tarefas atrasadas, risco alto, próximos 7 dias e matérias sem conclusão recente.
- Foco: timer que acompanha o tempo real, pausa, conclusão e sessão preservada ao recarregar.
- Estou travado: cinco motivos e ações práticas, sem IA; sessão curta, primeiro passo, descoberta ou adiamento na rota.
- Temas claro/escuro, layouts responsivos, diálogos acessíveis e persistência local.

## Estrutura

```text
src/
  App.tsx                  navegação e composição dos fluxos
  pages/                   Hoje, To-do, Radar e Foco
  components/              Modal, TaskForm, TaskRow
  hooks/useOrbit.ts        estado e operações de tarefas
  domain/
    planner.ts             planejamento, risco e datas
    planner.test.ts         testes do algoritmo
    focus.ts               cálculo do tempo real de foco
    debugger.ts            sugestões e ações predefinidas
    seed.ts                exemplo com datas relativas
  storage/repository.ts    contrato de persistência e localStorage
  lib/format.ts            apresentação de duração
  types.ts                 tipos do domínio
  styles.css               tokens, temas e layouts
```

## Decisões

O planejamento é determinístico. O score favorece atraso, prazo próximo, prioridade e sessões curtas. A seleção percorre essa ordem e inclui somente tarefas que cabem nos minutos disponíveis; tarefas maiores continuam no To-do. Empates usam criação e id. `generateDailyPlan`, `getRecommendedTask`, `calculateTaskRisk` e `replanDay` são funções independentes do React.

A viabilidade é `min(100, minutos disponíveis / minutos pendentes * 100)`. É um indicador de carga do backlog, não uma previsão científica. O risco é alto para atrasos, prazos até amanhã ou tarefas urgentes de grande esforço/alta prioridade. Os critérios estão explícitos em `planner.ts`.

Replanejar recalcula a rota com os dados atuais e limpa os adiamentos manuais da ordem. “Não quero fazer isso agora” coloca a tarefa depois no dia atual, até replanejar. Prazos nunca são movidos automaticamente. Subtarefas são tarefas independentes com referência textual à tarefa original; não há hierarquia complexa no MVP.

O Radar considera conclusão recente como atividade. Os dados de demonstração são gerados só no primeiro uso. Tudo fica neste navegador sob `orbit.data.v1`; não existe sincronização entre dispositivos. Falhas de armazenamento geram aviso e dados inválidos não são sobrescritos silenciosamente. O contrato `DataRepository` permite adicionar uma API posteriormente.

O timer guarda o instante de início e o tempo acumulado; permanece coerente em abas em segundo plano. Chegar a zero pausa a sessão, e concluir a tarefa é uma decisão explícita. Há uma sessão ativa por vez.

## Próximas versões

Backend e conta, sincronização, IA para planejamento e debugger, histórico de sessões, subtarefas relacionadas, notificações e memória operacional de hábitos/esquecimentos. O MVP não infere padrões pessoais.

## Validação

Testes de risco, calendário, ordem, orçamento de tempo, tarefas concluídas, empate e replanejamento sem alteração de prazos. Build de produção com TypeScript em modo estrito. Fluxos principais também conferidos no navegador.

## Referências técnicas

Configuração baseada nas documentações oficiais de [Vite](https://vite.dev/guide/), [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite) e [pnpm](https://pnpm.io/settings).
