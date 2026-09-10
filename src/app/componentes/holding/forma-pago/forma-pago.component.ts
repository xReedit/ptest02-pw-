import { Component, EventEmitter, Input, Output } from '@angular/core';
import { URL_IMG_ICONS } from 'src/app/shared/config/config.const';
import { urlImagen } from 'src/app/shared/utils/img-url';
import { HoldingService } from 'src/app/shared/services/holding.service';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';

interface PaymentMethod {
  id: number;
  name: string;
  icon: string;
  amount: number;
  amount_real: number; 
  isActive: boolean;
  isDisabled: boolean;
}

interface PaymentResponse {
  methods: PaymentMethod[];
  isPaymentSuccess: boolean;
}

@Component({
  selector: 'app-forma-pago',
  templateUrl: './forma-pago.component.html',
  styleUrls: ['./forma-pago.component.css']
})
export class FormaPagoComponent {  
  @Input() totalAmount: number = 0;
  // @Output() paymentsSelected = new EventEmitter<PaymentMethod[]>();
  @Output() paymentsSelected = new EventEmitter<PaymentResponse>();

  remainingAmount: number = 0;
  paymentMethods: PaymentMethod[] = [];
  
  // = [
  //   { id: 1, name: 'Efectivo', icon: 'cash', amount: 0, isActive: false, isDisabled: false },
  //   { id: 2, name: 'Tarjeta', icon: 'card', amount: 0, isActive: false, isDisabled: false },
  //   { id: 3, name: 'QR', icon: 'qr-code', amount: 0, isActive: false, isDisabled: false }
  // ];

  constructor(
    private holdingService: HoldingService,
    private utilService: UtilitariosService
  ) {
    this.loadTipoPago();
  }
  

  ngOnInit() {    
    this.remainingAmount = this.totalAmount;
  }

  

  loadTipoPago() {
    const _metodoPago = this.holdingService.getMetodoPagoMozo();        
    _metodoPago.subscribe((res: any) => {      
      if (res.length > 0) {
         res.map((elem: any) => {
          this.paymentMethods.push({
            id: elem.idtipo_pago,
            name: this.utilService.primeraConMayusculas(elem.descripcion),
            icon: urlImagen(URL_IMG_ICONS, elem.img),
            amount: 0,
            amount_real: 0,
            isActive: false,
            isDisabled: false
          });       
        }); 
      }     
    });
  }

  onAmountChange(method: PaymentMethod, event: any) {
    let amount = Number(event.target.value);
    
    // Adjust digital payment amounts
    if (method.id !== 1) { // If not cash
      const maxAllowed = this.getMaxAllowedAmount(method);
      if (amount > maxAllowed) {
        amount = maxAllowed;
        event.target.value = amount;
      }
      method.amount_real = amount; // For digital payments, real amount equals input amount
    } else {
      // For cash, real amount is min between remaining and input amount
      method.amount_real = Math.min(amount, this.remainingAmount + method.amount);
    }

    method.amount = amount;
    method.isActive = amount > 0;
    
    this.calculateRemaining();
    this.updateMethodStates();
    this.emitSelectedPayments();
  }

  private getMaxAllowedAmount(method: PaymentMethod): number {
    if (method.id === 1) { // Cash can exceed total
      return this.remainingAmount + method.amount;
    }
    // For card and QR, can't exceed remaining + current amount
    return Math.min(
      this.totalAmount,
      this.remainingAmount + method.amount
    );
  }

  private calculateRemaining() {
    const totalPaid = this.paymentMethods.reduce((sum, method) => sum + method.amount, 0);
    this.remainingAmount = this.totalAmount - totalPaid;
  }

  private updateMethodStates() {
    if (this.remainingAmount <= 0) {
      this.paymentMethods.forEach(method => {
        method.isDisabled = !method.isActive;
      });
    } else {
      this.paymentMethods.forEach(method => {
        method.isDisabled = false;
      });
    }
  }

  private emitSelectedPayments() {
    const activePayments = this.paymentMethods.filter(m => m.isActive);
    const totalPaid = activePayments.reduce((sum, method) => sum + method.amount_real, 0);
    
    const response: PaymentResponse = {      
      methods: activePayments.map(method => ({
        ...method,
        amount_real: method.id === 1 ? 
          Math.min(method.amount, this.totalAmount) : // For cash
          method.amount // For digital payments
      })),
      isPaymentSuccess: totalPaid >= this.totalAmount
    };

    console.log('response', response);
    this.paymentsSelected.emit(response);
  }

  selectInputContent(event: any): void {
    event.target.select();
  }
}