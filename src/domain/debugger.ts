import type { BlockerReason } from "../types";
export const reasons: [BlockerReason, string, string][] = [
  [
    "start",
    "Não sei como começar",
    "Vamos reduzir o primeiro passo. Trabalhe nisso por apenas 10 minutos.",
  ],
  [
    "large",
    "Está grande demais",
    "Separe em entender, praticar e revisar. Comece pela parte mais simples.",
  ],
  [
    "tired",
    "Estou cansado",
    "Uma sessão pequena pode ser suficiente. Ou reserve esse passo para outro momento.",
  ],
  [
    "information",
    "Está faltando informação",
    "Antes de resolver, descubra o que falta. Transforme a dúvida em uma tarefa de 10 minutos.",
  ],
  [
    "avoid",
    "Não quero fazer isso agora",
    "Vamos trocar a ordem dos próximos passos, mantendo os prazos.",
  ],
];
