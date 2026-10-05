export const blockers = [
  {
    title: "Não sei como começar",
    suggestion:
      "Escolha um primeiro passo de até 10 minutos. Pode ser abrir o material e anotar três perguntas.",
    action: "Fazer 10 minutos",
    type: "short",
  },
  {
    title: "A tarefa está grande demais",
    suggestion:
      "Divida em três partes: entender, praticar e revisar. Comece pela menor parte.",
    action: "Criar primeiro passo",
    type: "subtask",
  },
  {
    title: "Estou cansado",
    suggestion:
      "Reduza a sessão para 10 minutos. Se ainda estiver pesado, deixe essa tarefa para depois na rota.",
    action: "Fazer 10 minutos",
    type: "short",
  },
  {
    title: "Está faltando alguma informação",
    suggestion:
      "Transforme a dúvida em uma ação: descobrir o material, confirmar o enunciado ou pedir ajuda.",
    action: "Criar tarefa de descoberta",
    type: "info",
  },
  {
    title: "Não quero fazer isso agora",
    suggestion:
      "Tudo bem ajustar a rota. Coloque esta tarefa depois e escolha o próximo passo possível.",
    action: "Reorganizar minha rota",
    type: "defer",
  },
] as const;
