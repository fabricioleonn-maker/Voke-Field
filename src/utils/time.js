/**
 * Centralized Time Utility for Brasilia (GMT-3)
 * Ensures consistent time across all users regardless of their system timezone.
 */

export const getBrasiliaDate = (date = new Date()) => {
  return new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
};

export const getBrasiliaTodayStr = (date = getBrasiliaDate()) => {
  const d = getBrasiliaDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getBrasiliaISO = (date = new Date()) => {
  return getBrasiliaDate(date).toISOString();
};

export const formatBrasiliaTime = (date = new Date()) => {
  const d = getBrasiliaDate(date);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const formatBrasiliaFullTime = (date = new Date()) => {
  const d = getBrasiliaDate(date);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const getBrasiliaDecimalHour = (date = new Date()) => {
  const d = getBrasiliaDate(date);
  return d.getHours() + (d.getMinutes() / 60);
};
