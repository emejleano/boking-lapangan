/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  password?: string;
}

export interface Court {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  pricePerHour: number;
  status: 'available' | 'maintenance';
}

export interface EquipmentRental {
  name: string;
  price: number;
  quantity: number;
}

export interface Booking {
  id: string;
  userId: string;
  userEmail: string;
  userPhone: string;
  userName: string;
  courtId: string;
  courtName: string;
  date: string;
  timeSlots: number[]; // e.g. [8, 9] means booking for 08:00 - 10:00
  duration: number;
  equipmentRental: EquipmentRental[];
  totalCost: number;
  dpPaid: number; // Down Payment / Uang Muka (e.g., 50%)
  status: 'pending_confirmation' | 'approved' | 'cancelled';
  paymentMethod: 'transfer_bank' | 'qris';
  paymentProof?: string;
  fullPaymentProof?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: number;
  type: 'bank' | 'qris';
  accountName: string;
  accountNumber: string;
  isEnabled: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface AddonEquipment {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface Stats {
  totalRevenue: number;
  pendingBookings: number;
  approvedBookings: number;
  cancelledBookings: number;
  courtPopularity: { name: string; value: number }[];
  revenueByDay: { day: string; revenue: number }[];
}
