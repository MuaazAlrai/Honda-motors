import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface WhatsAppLedgerMessage {
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  totalInvoices: number;
}

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private readonly defaultCountryCode = environment.whatsapp.defaultCountryCode.replace(/\D/g, '');
  private readonly businessName = environment.whatsapp.businessName;

  openCustomerLedger(contact: string, ledger: WhatsAppLedgerMessage): void {
    const phoneNumber = this.toInternationalPhone(contact);
    if (!phoneNumber) {
      throw new Error('Please enter a valid customer WhatsApp number.');
    }

    window.open(
      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(this.createLedgerMessage(ledger))}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  canOpen(contact: string): boolean {
    return this.toInternationalPhone(contact).length > 0;
  }

  private toInternationalPhone(contact: string): string {
    const digits = contact.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('00')) return digits.slice(2);
    if (digits.startsWith(this.defaultCountryCode)) return digits;
    if (digits.startsWith('0')) return `${this.defaultCountryCode}${digits.slice(1)}`;
    return `${this.defaultCountryCode}${digits}`;
  }

  private createLedgerMessage(ledger: WhatsAppLedgerMessage): string {
    const remainingLine = ledger.remainingAmount > 0
      ? `Remaining balance: ${this.formatCurrency(ledger.remainingAmount)}`
      : 'Your account is fully paid.';

    return [
      `Assalam-o-Alaikum ${ledger.customerName},`,
      `This is your ${this.businessName} account update.`,
      `Invoices: ${ledger.totalInvoices}`,
      `Total bill: ${this.formatCurrency(ledger.totalAmount)}`,
      `Paid: ${this.formatCurrency(ledger.paidAmount)}`,
      remainingLine,
      'Thank you.'
    ].join('\n');
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(amount);
  }
}
