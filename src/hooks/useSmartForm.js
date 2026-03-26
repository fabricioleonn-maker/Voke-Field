// Hook centralizado de automações de formulário (CEP, CNPJ, CPF, Banco)
import { getBrasiliaDate } from '../utils/time';

// Lista de bancos brasileiros (principais)
export const BANKS = {
  '001': 'Banco do Brasil', '033': 'Santander', '041': 'Banrisul', '070': 'BRB',
  '077': 'Inter', '104': 'Caixa Econômica Federal', '212': 'Banco Original',
  '237': 'Bradesco', '260': 'Nubank', '290': 'PagBank', '318': 'BMG',
  '336': 'C6 Bank', '341': 'Itaú Unibanco', '389': 'Banco Mercantil',
  '422': 'Safra', '623': 'PAN', '633': 'Rendimento', '745': 'Citibank',
  '748': 'Sicredi', '756': 'Sicoob', '999': 'Agibank'
};

// --- Formatadores ---
export function formatCPF(val) {
  return val.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatCNPJ(val) {
  return val.replace(/\D/g, '').slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function formatPhone(val) {
  const n = val.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

export function formatCEP(val) {
  return val.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d{0,3})/, '$1-$2');
}

export function formatRG(val) {
  return val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12);
}

export function onlyNumbers(val) {
  return val.replace(/\D/g, '');
}

// --- VALIDATORS ---

const isAllSameDigits = (s) => /^(.)\1+$/.test(s.replace(/\D/g, ''));

export const validateCPF = (cpf) => {
  const s = cpf.replace(/\D/g, '');
  if (s.length !== 11 || isAllSameDigits(s)) return false;
  // ... (algoritmo simplificado ou completo, mantendo o que já estava se possível)
  // Vou manter o anterior mas adicionando o check de dígitos iguais
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(s.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if ((rest === 10) || (rest === 11)) rest = 0;
  if (rest !== parseInt(s.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(s.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if ((rest === 10) || (rest === 11)) rest = 0;
  if (rest !== parseInt(s.substring(10, 11))) return false;
  return true;
};

export const validateRG = (rg) => {
  const s = rg.replace(/\D/g, '');
  if (s.length < 5 || s.length > 14 || isAllSameDigits(s)) return false;
  return true;
};

export const validateBirthDate = (dateStr) => {
  if (!dateStr) return false;
  const date = getBrasiliaDate(new Date(dateStr));
  const now = getBrasiliaDate();
  const age = now.getFullYear() - date.getFullYear();
  if (isNaN(date.getTime())) return false;
  // Permitir entre 14 e 100 anos
  return age >= 14 && age <= 100;
};

export const validatePhone = (phone) => {
  const s = phone.replace(/\D/g, '');
  if (s.length < 10 || s.length > 11 || isAllSameDigits(s)) return false;
  // DDDs válidos no Brasil começam com 1-9 e o segundo dígito tbm
  if (s[0] === '0') return false; 
  return true;
};

export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateCNPJ = (cnpj) => {
  const s = cnpj.replace(/\D/g, '');
  if (s.length !== 14 || isAllSameDigits(s)) return false;
  // Algoritmo de validação de CNPJ
  let size = s.length - 2;
  let numbers = s.substring(0, size);
  const digits = s.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  size = size + 1;
  numbers = s.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  return true;
};

// --- Consultas de API ---
export async function fetchCEP(cep) {
  const n = cep.replace(/\D/g, '');
  if (n.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${n}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return { logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf };
  } catch { return null; }
}

export async function fetchCNPJ(cnpj) {
  const n = cnpj.replace(/\D/g, '');
  if (n.length !== 14) return null;
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${n}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      razaoSocial: data.razao_social,
      email: data.email || '',
      telefone: data.ddd_telefone_1 || '',
      cep: data.cep || '',
      logradouro: (data.logradouro_tipo ? data.logradouro_tipo + ' ' : '') + (data.logradouro || ''),
      numero: data.numero,
      bairro: data.bairro,
      cidade: data.municipio,
      estado: data.uf
    };
  } catch { return null; }
}

export function lookupBank(code) {
  return BANKS[code.padStart(3, '0')] || null;
}

export function getPixMask(type) {
  switch (type) {
    case 'cpf': return 'cpf';
    case 'cnpj': return 'cnpj';
    case 'celular': return 'phone';
    case 'email': return 'email';
    default: return 'text';
  }
}

export function validatePix(type, val) {
  if (!val) return false;
  const raw = val.replace(/\D/g, '');
  switch (type) {
    case 'cpf': return validateCPF(raw);
    case 'cnpj': return validateCNPJ(raw);
    case 'celular': return validatePhone(val);
    case 'email': return validateEmail(val);
    case 'aleatoria': return val.length >= 20;
    default: return val.length > 0;
  }
}

export async function fetchCoordinates(address) {
  if (!address || address.length < 5) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: data[0].lat, lon: data[0].lon };
    }
    return null;
  } catch { return null; }
}
