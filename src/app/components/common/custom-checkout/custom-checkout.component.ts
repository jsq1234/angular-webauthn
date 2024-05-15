import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-custom-checkout',
  standalone: true,
  imports: [],
  templateUrl: './custom-checkout.component.html',
  styleUrl: './custom-checkout.component.css'
})
export class CustomCheckoutComponent {
  @Input() checked: boolean = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  toggleChecked(event: any) {
    this.checked = event.target.checked;
    this.checkedChange.emit(this.checked);
  }
}
