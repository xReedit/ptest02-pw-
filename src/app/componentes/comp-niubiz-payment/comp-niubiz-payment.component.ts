import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { NiubizService, NiubizPaymentRequest, NiubizPaymentResponse, NiubizClientData } from 'src/app/shared/services/niubiz.service';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';

@Component({
  selector: 'app-comp-niubiz-payment',
  templateUrl: './comp-niubiz-payment.component.html',
  styleUrls: ['./comp-niubiz-payment.component.css']
})
export class CompNiubizPaymentComponent implements OnInit, OnDestroy {

  @Input() importe: number = 0;
  @Input() clientData: NiubizClientData | null = null;
  @Input() simboloMoneda: string = 'S/';
  
  @Output() paymentSuccess = new EventEmitter<NiubizPaymentResponse>();
  @Output() paymentError = new EventEmitter<NiubizPaymentResponse>();
  @Output() paymentCancel = new EventEmitter<{ shouldReload: boolean }>();

  isLoading = false;
  isPaymentButtonVisible = false;
  isProcessingPayment = false;
  isPaymentSuccess = false;
  errorMessage: string = '';
  purchaseNumber: string = '';
  showNiubizContainer = true;
  successMessage: string = '';
  showCheckIcon = false;

  private paymentSubscription: Subscription | null = null;
  private readyToRenderSubscription: Subscription | null = null;

  constructor(
    private niubizService: NiubizService,
    private crudService: CrudHttpService
  ) {}

  ngOnInit(): void {
    this.setupGlobalCallback();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private setupGlobalCallback(): void {
    (window as any).responseFormNiubiz = (event: any) => {
      if (event?.message?.args?.[0]) {
        const token = event.message.args[0].token;
        window.dispatchEvent(new CustomEvent('payment.success', { detail: token }));
      }
    };
  }

  iniciarPago(): void {
    this.errorMessage = '';
    
    if (this.importe <= 0) {
      this.errorMessage = 'El importe debe ser mayor a 0';
      return;
    }

    this.isLoading = true;
    this.obtenerPurchaseNumber();
  }

  private obtenerPurchaseNumber(): void {
    this.crudService.getAll('transaction', 'get-purchasenumber', false, false, false)
      .subscribe({
        next: (res: any) => {
          this.purchaseNumber = res.data[0].purchasenumber;
          this.procesarPago();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Error al generar número de transacción';
          console.error('Error obteniendo purchasenumber:', err);
        }
      });
  }

  private procesarPago(): void {
    const clientDataToUse: NiubizClientData = this.clientData || {
      email: 'cliente@pago.com',
      nombre: 'Cliente',
      apellido: 'Invitado',
      idcliente: '0',
      ip: '0.0.0.0',
      diasRegistrado: 0
    };

    const request: NiubizPaymentRequest = {
      importe: this.importe,
      purchaseNumber: this.purchaseNumber,
      clientData: clientDataToUse
    };

    // Limpiar suscripción anterior si existe
    if (this.readyToRenderSubscription) {
      this.readyToRenderSubscription.unsubscribe();
    }

    // Escuchar cuando el servicio esté listo para renderizar
    this.readyToRenderSubscription = this.niubizService.readyToRender$.subscribe(() => {
      // Mostrar el contenedor
      this.isLoading = false;
      this.isPaymentButtonVisible = true;
      
      // Asegurar que showNiubizContainer esté en true
      this.showNiubizContainer = true;
    });

    // Iniciar el proceso de pago (mantiene isLoading=true para mostrar spinner)
    this.paymentSubscription = this.niubizService.processPayment(request)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Mostrar loading mientras se procesa la autorización
            this.isProcessingPayment = true;
            this.isPaymentButtonVisible = false;
            this.showCheckIcon = false;
            this.successMessage = 'Procesando pago...';
            
            // Esperar 1.5 segundos y mostrar mensaje de éxito con check
            setTimeout(() => {
              this.showCheckIcon = true;
              this.successMessage = '¡Pago exitoso!';
              
              // Esperar 1.5 segundos más antes de emitir la respuesta
              setTimeout(() => {
                this.paymentSuccess.emit(response);
              }, 1500);
            }, 1500);
          } else {
            this.isProcessingPayment = false;
            this.errorMessage = response.errorMessage || 'Error en la transacción';
            this.paymentError.emit(response);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.isPaymentButtonVisible = false;
          this.isProcessingPayment = false;
          this.errorMessage = 'Error al procesar el pago';
          this.paymentError.emit({
            success: false,
            error: true,
            errorMessage: 'Error al procesar el pago',
            rawResponse: err
          });
        }
      });
  }

  cancelar(): void {
    // Solo debe recargar si el botón de Niubiz ya apareció
    const shouldReload = this.isPaymentButtonVisible;
    
    this.niubizService.cancelPayment();
    this.cleanup();
    this.paymentCancel.emit({ shouldReload });
  }

  private cleanup(): void {
    if (this.paymentSubscription) {
      this.paymentSubscription.unsubscribe();
      this.paymentSubscription = null;
    }
    if (this.readyToRenderSubscription) {
      this.readyToRenderSubscription.unsubscribe();
      this.readyToRenderSubscription = null;
    }
    
    // Forzar la destrucción y recreación del contenedor
    this.showNiubizContainer = false;
    this.isPaymentButtonVisible = false;
    this.isLoading = false;
    this.isProcessingPayment = false;
    this.isPaymentSuccess = false;
    this.showCheckIcon = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.purchaseNumber = '';
    
    // Recrear el contenedor en el siguiente ciclo de detección
    setTimeout(() => {
      this.showNiubizContainer = true;
    }, 0);
  }
}

