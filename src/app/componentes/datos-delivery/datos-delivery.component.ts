import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-datos-delivery',
  templateUrl: './datos-delivery.component.html',
  styleUrls: ['./datos-delivery.component.css']
})
export class DatosDeliveryComponent implements OnInit {
  @Output() public changeStatus = new EventEmitter<any>();

  myForm: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.myForm = this.fb.group({
      nombre: new FormControl('', [Validators.required]),
      direccion: new FormControl('', [Validators.required]),
      telefono: new FormControl('', [Validators.required]),
      paga_con: new FormControl('', [Validators.required]),
      dato_adicional: new FormControl('')
    });

    this.myForm.statusChanges.subscribe(res => {
      const isValid = res === 'VALID' ? true : false;
      const dataEmit = {
        formIsValid: isValid,
        formData: this.myForm.value
      };

      this.changeStatus.emit(dataEmit);
      // console.log('form delivery', dataEmit);
    });
  }

}
