# Orbit · desktop study companion

Orbit é um aplicativo desktop de estudo para Windows e macOS, com React + TypeScript + Vite dentro do Tauri 2. A tela Hoje responde “o que estudar agora?” sem um dashboard cheio de cards.

## Executar

Instale Node.js 22.12+ e pnpm 11. Instale também os [pré-requisitos oficiais do Tauri](https://v2.tauri.app/start/prerequisites/): Rust estável, Microsoft C++ Build Tools com o workload Desktop development with C++ e WebView2 no Windows; Xcode Command Line Tools no macOS. O projeto exige Rust 1.90 ou mais recente.

```sh
pnpm install
pnpm desktop:dev
```

Isso abre uma janela nativa do Orbit. Não abre um navegador. A janela usa controles nativos do sistema e permite arrastar a barra superior. O modo de desenvolvimento depende de Vite; o app empacotado inclui a interface e funciona sem servidor.

Para trabalhar somente no frontend:

```sh
pnpm dev
```

Abra http://127.0.0.1:5173. O armazenamento dessa prévia é separado do aplicativo instalado. Caso uma prévia Vite já esteja aberta, encerre-a antes de `desktop:dev`, pois a porta 5173 é fixa.

```sh
pnpm test
pnpm build               # TypeScript + interface interna
pnpm desktop:build       # executável e instalador da plataforma atual
```

No Windows, para gerar apenas o instalador NSIS: `pnpm desktop:build --bundles nsis`.
No macOS: `pnpm desktop:build --bundles dmg,app`. O instalador macOS deve ser construído no macOS, não em uma compilação cruzada a partir do Windows.

## Builds no GitHub

O workflow `Orbit desktop` executa testes e compila Windows x64, macOS Apple Silicon e macOS Intel a cada push em `main`. Ele entrega artefatos na página da execução do GitHub Actions: instalador `.exe`/executável Windows e `.dmg`/`.app` macOS. O diretório `src-tauri/target/` é ignorado pelo Git.

Esses builds de desenvolvimento não usam assinatura de código nem notarização. A distribuição pública polida precisa dessas etapas; não há atualização automática nesta versão. Não existe publicação automática de release.

## Experiência

- Hoje: um próximo passo central, Começar/Adiar/Estou travado, até três próximas tarefas e timeline com pausas e espaço livre.
- Replanejamento: comparação visual de horários e tarefas antes/depois. Prazos nunca mudam automaticamente.
- Foco: timer minimalista, pausa/retomada, tempo extra real, conclusão e convite para a próxima atividade.
- Debugger: cinco motivos, sessão de 10 minutos, primeiro passo/descoberta e ajuste da rota, usando regras locais.
- To-do: CRUD preservado, filtros discretos, agrupamento por matéria e indicação de prioridade.
- Radar: atraso, risco, prazos próximos, matérias sem atividade e insights com evidência.
- Command palette: Ctrl+K / Cmd+K; setas e Enter para selecionar. Ctrl+N / Cmd+N cria tarefa.
- Configurações: nome, início da rota, tempo disponível, duração de pausas, exportação e importação de cópia local com confirmação.

## Arquitetura

```text
src/
  App.tsx                    composição de telas e ações
  pages/                     Hoje, To-do, Radar, Foco
  components/                formulários, diálogos, palette e comparação
  hooks/useOrbit.ts          operações, carregamento e fila de gravação
  domain/
    planner.ts               score, risco e planejamento original
    timeline.ts              rota com pausas, horários e comparação
    focus.ts                 relógio da sessão
    memory.ts                sessões e eventos de comportamento
    insights.ts              inferências com limiares explícitos
    seed.ts                  demonstração sem histórico inventado
  storage/
    repository.ts            validação e migração v1 → v2
    desktopRepository.ts     arquivo Tauri ou adapter do navegador
  types.ts                   contratos de domínio
  styles.css                 temas, layout de desktop e acessibilidade
src-tauri/
  src/                       runtime Rust e verificação de inicialização
  capabilities/              permissões locais e da janela
  tauri.conf.json            identidade, janela, CSP e empacotamento
.github/workflows/desktop.yml
```

O algoritmo original e seus testes são preservados. A nova rota inclui o custo das pausas no orçamento, ordena por atraso/prazo/prioridade/duração e mantém o excedente no To-do. Depois de uma sessão, o tempo real registrado é descontado do tempo diário disponível. A rota seguinte usa o instante da conclusão; replanejar ajusta o início ao horário atual e limpa adiamentos da ordem. Adiar altera a ordem, mantendo o prazo.

A viabilidade compara a carga pendente, incluindo pausas, com o tempo restante. É um indicador de carga, não uma previsão de desempenho. Uma tarefa inacabada permanece com sua estimativa original; não há cálculo de percentual de conteúdo aprendido.

## Memória e persistência

No desktop, `@tauri-apps/plugin-store` grava `orbit.json` no diretório de dados do aplicativo. Gravações são serializadas, e fechar a janela aguarda a última gravação. Se houver falha, o app avisa e oferece exportação. O contrato assíncrono permite trocar por SQLite ou uma API mais tarde.

A prévia web mantém `localStorage` sob a chave anterior `orbit.data.v1`. O formato v1 migra para v2 preservando tarefas/matérias e adicionando memória vazia. Dados inválidos não são sobrescritos silenciosamente. A prévia do navegador e o aplicativo são ambientes separados: use Exportar dados no navegador e Importar cópia no app para transferir o histórico. A importação mostra uma confirmação antes de substituir os dados.

Sessões registram id, tarefa/matéria, início/fim, duração planejada/real e resultado. Pausas não contam como estudo. O relógio usa timestamps e acumulação; funciona em segundo plano e após reabrir. Ao atingir zero, o timer mostra tempo extra em vez de concluir a tarefa automaticamente. Conclusões, adiamentos e aberturas/motivos do debugger são eventos locais. Uma sessão ativa por vez.

Insights só aparecem com dados suficientes: três adiamentos da mesma tarefa; quatro usos do debugger na matéria; cinco tarefas distintas observadas para comparar estimativas, com pelo menos 60% acima da estimativa em mais de 20%; oito sessões concluídas de pelo menos um minuto para sugerir período predominante, com concentração mínima de 60%. As mensagens mostram contagem e contexto; não são diagnósticos nem recomendações por IA.

## Validação

43 testes: os 17 originais e 26 testes adicionais de timeline, orçamento com pausas, comparação de rotas, memória, tempo extra, insights e migração. `pnpm build` verifica TypeScript estrito e gera a interface.

Para uma verificação automatizada do executável, defina `ORBIT_SMOKE_REPORT` com um caminho absoluto para um arquivo de relatório antes de abrir o app. O modo de verificação carrega a interface, aguarda a persistência, registra plataforma/versão e encerra. Sem essa variável, o app abre normalmente. A verificação não cria histórico de estudo fictício.

## Próxima etapa

Validar sessões reais de universitários, calibrar prioridades/pausas, adicionar edição de subtarefas relacionadas e preparar assinatura/notarização para distribuição. SQLite pode ser considerado quando o histórico local crescer. Sem backend, conta, pagamentos, IA, APIs externas, sincronização, push ou colaboração nesta etapa.

## Referências

[Tauri com Vite](https://v2.tauri.app/start/frontend/vite/), [armazenamento local](https://v2.tauri.app/plugin/store/), [janelas](https://v2.tauri.app/learn/window-customization/) e [builds no GitHub](https://v2.tauri.app/distribute/pipelines/github/).
