import React from 'react';
import {
  Restaurant,
  Car,
  ShoppingCart,
  Home,
  Location,
  GasStation,
  Hospital,
  Education,
  ShoppingBag,
  Cafe,
  Play,
  Music,
  Gift,
  Receipt,
  Wallet
} from '@carbon/icons-react';
import { ExpenseIcon } from '../types';

export const EXPENSE_ICONS: Record<ExpenseIcon, { component: React.ComponentType<any>; label: string }> = {
  Restaurant: { component: Restaurant, label: 'Restaurante' },
  Car: { component: Car, label: 'Transporte' },
  ShoppingCart: { component: ShoppingCart, label: 'Compras' },
  Home: { component: Home, label: 'Hogar' },
  Airplane: { component: Location, label: 'Viaje' },
  GasStation: { component: GasStation, label: 'Combustible' },
  Hospital: { component: Hospital, label: 'Salud' },
  Education: { component: Education, label: 'Educación' },
  ShoppingBag: { component: ShoppingBag, label: 'Tienda' },
  Cafe: { component: Cafe, label: 'Café' },
  Movie: { component: Play, label: 'Entretenimiento' },
  Music: { component: Music, label: 'Música' },
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

export function getExpenseIcon(iconName?: ExpenseIcon, size: number = 24) {
  if (!iconName || !EXPENSE_ICONS[iconName]) {
    return null;
  }
  const IconComponent = EXPENSE_ICONS[iconName].component;
  return <IconComponent size={size} />;
}
