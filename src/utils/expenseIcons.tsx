import React from 'react';
import {
  ForkKnife,
  Car,
  ShoppingCart,
  House,
  Airplane,
  GasPump,
  FirstAid,
  GraduationCap,
  ShoppingBag,
  Coffee,
  FilmSlate,
  MusicNotes,
  Gift,
  Receipt,
  Wallet
} from '@phosphor-icons/react';
import { ExpenseIcon } from '../types';

export const EXPENSE_ICONS: Record<ExpenseIcon, { component: React.ComponentType<any>; label: string }> = {
  Restaurant: { component: ForkKnife, label: 'Restaurante' },
  Car: { component: Car, label: 'Transporte' },
  ShoppingCart: { component: ShoppingCart, label: 'Compras' },
  Home: { component: House, label: 'Hogar' },
  Airplane: { component: Airplane, label: 'Viaje' },
  GasStation: { component: GasPump, label: 'Combustible' },
  Hospital: { component: FirstAid, label: 'Salud' },
  Education: { component: GraduationCap, label: 'Educación' },
  ShoppingBag: { component: ShoppingBag, label: 'Tienda' },
  Cafe: { component: Coffee, label: 'Café' },
  Movie: { component: FilmSlate, label: 'Entretenimiento' },
  Music: { component: MusicNotes, label: 'Música' },
  Gift: { component: Gift, label: 'Regalo' },
  Receipt: { component: Receipt, label: 'Factura' },
  Wallet: { component: Wallet, label: 'Otro' },
};

export const EXPENSE_ICON_OPTIONS: ExpenseIcon[] = [
  'Restaurant',
  'Cafe',
  'Car',
  'GasStation',
  'ShoppingCart',
  'ShoppingBag',
  'Home',
  'Hospital',
  'Education',
  'Airplane',
  'Movie',
  'Music',
  'Gift',
  'Receipt',
  'Wallet',
];

export const EXPENSE_BG_COLORS = [
  { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { bg: 'bg-rose-100', text: 'text-rose-600' },
  { bg: 'bg-amber-100', text: 'text-amber-600' },
  { bg: 'bg-sky-100', text: 'text-sky-600' },
  { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  { bg: 'bg-violet-100', text: 'text-violet-600' },
  { bg: 'bg-orange-100', text: 'text-orange-600' },
  { bg: 'bg-teal-100', text: 'text-teal-600' },
  { bg: 'bg-pink-100', text: 'text-pink-600' },
  { bg: 'bg-cyan-100', text: 'text-cyan-600' },
];

export function getExpenseColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % EXPENSE_BG_COLORS.length;
  return EXPENSE_BG_COLORS[index];
}

export function getExpenseIcon(iconName?: ExpenseIcon, size: number = 24) {
  if (!iconName || !EXPENSE_ICONS[iconName]) {
    return null;
  }
  const IconComponent = EXPENSE_ICONS[iconName].component;
  return <IconComponent size={size} />;
}
