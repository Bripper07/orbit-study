export const prettyMinutes = (m: number) =>
  m >= 60
    ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}min` : ""}`
    : `${m} min`;
