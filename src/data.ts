/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Court } from './types';

export const INITIAL_COURTS: Court[] = [
  {
    id: 'court-futsal-1',
    name: 'Standard Futsal Arena',
    category: 'futsal',
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&q=80&w=600',
    description: 'Lapangan futsal indoor bersertifikasi standar nasional dengan rumput sintetis berkualitas tinggi, sirkulasi udara optimal, dan penerangan LED mewah.',
    pricePerHour: 150000,
    status: 'available',
  },
  {
    id: 'court-futsal-2',
    name: 'Vinyl Futsal Court',
    category: 'futsal',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=600',
    description: 'Lapangan futsal beralas vinyl premium (interlock) yang aman bagi lutut. Sempurna untuk latihan taktis maupun turnamen profesional.',
    pricePerHour: 180000,
    status: 'available',
  },
  {
    id: 'court-basket-1',
    name: 'Grand Basketball Stadium',
    category: 'basket',
    image: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=600',
    description: 'Lapangan basket kelas profesional dengan lantai kayu jati (hardwood floor) berkualitas tinggi, ring basket hidrolik standar FIBA, dan tribun penonton.',
    pricePerHour: 220000,
    status: 'available',
  },
  {
    id: 'court-badminton-1',
    name: 'Badminton Court VIP A',
    category: 'badminton',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600',
    description: 'Lapangan bulu tangkis VIP dengan karpet vinyl terbaik anti licin, jarak atap optimal tanpa silau cahaya, serta pendingin GOR mumpuni.',
    pricePerHour: 70000,
    status: 'available',
  },
  {
    id: 'court-badminton-2',
    name: 'Badminton Court B',
    category: 'badminton',
    image: 'https://images.unsplash.com/photo-1521537634199-673cb821b74a?auto=format&fit=crop&q=80&w=600',
    description: 'Lapangan bulu tangkis nyaman dengan sasis interlock standar badminton. Ideal untuk rekreasi sehat bersama keluarga dan teman.',
    pricePerHour: 60000,
    status: 'available',
  },
  {
    id: 'court-padel-1',
    name: 'Padel Glass Court Panoramic',
    category: 'padel',
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=600',
    description: 'Olahraga terpopuler kekinian! Lapangan padel kaca panoramic premium outdoor berpasir silika impor, memberikan efek pantulan bola presisi tinggi.',
    pricePerHour: 250000,
    status: 'available',
  },
];

export interface AddonEquipment {
  id: string;
  name: string;
  category: 'futsal' | 'basket' | 'badminton' | 'padel' | 'all';
  price: number;
}

export const ADDON_EQUIPMENTS: AddonEquipment[] = [
  { id: 'eq-futsal-ball', name: 'Bola Futsal Premium (Sewa)', category: 'futsal', price: 15000 },
  { id: 'eq-futsal-bibs', name: 'Rompi Tim (1 Set/10 Pcs)', category: 'futsal', price: 20000 },
  { id: 'eq-basket-ball', name: 'Bola Basket Molten GG7X', category: 'basket', price: 20000 },
  { id: 'eq-badminton-racket', name: 'Raket Yonex Astrox (Per Pcs)', category: 'badminton', price: 15000 },
  { id: 'eq-badminton-shuttlecock', name: 'Shuttlecock 1 Slop (12 Pcs/Beli)', category: 'all', price: 40000 },
  { id: 'eq-padel-racket', name: 'Padel Racket Adidas (Per Pcs)', category: 'padel', price: 30000 },
  { id: 'eq-padel-balls', name: 'Bola Padel (1 Slop / 3 Pcs)', category: 'padel', price: 25000 },
  { id: 'eq-shoes', name: 'Sepatu Olahraga All-Size', category: 'all', price: 25000 },
];

export const AVAILABLE_TIME_SLOTS = [
  { hour: 7, label: '07:00 - 08:00' },
  { hour: 8, label: '08:00 - 09:00' },
  { hour: 9, label: '09:00 - 10:00' },
  { hour: 10, label: '10:00 - 11:00' },
  { hour: 11, label: '11:00 - 12:00' },
  { hour: 12, label: '12:00 - 13:00' },
  { hour: 13, label: '13:00 - 14:00' },
  { hour: 14, label: '14:00 - 15:00' },
  { hour: 15, label: '15:00 - 16:00' },
  { hour: 16, label: '16:00 - 17:00' },
  { hour: 17, label: '17:00 - 18:00' },
  { hour: 18, label: '18:00 - 19:00' },
  { hour: 19, label: '19:00 - 20:00' },
  { hour: 20, label: '20:00 - 21:00' },
  { hour: 21, label: '21:00 - 22:00' },
  { hour: 22, label: '22:00 - 23:00' },
];
