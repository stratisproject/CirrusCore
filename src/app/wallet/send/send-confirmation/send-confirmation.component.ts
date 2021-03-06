import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GlobalService } from '@shared/services/global.service';
import { CoinNotationPipe } from '@shared/pipes/coin-notation.pipe';

@Component({
  selector: 'app-send-confirmation',
  templateUrl: './send-confirmation.component.html',
  styleUrls: ['./send-confirmation.component.css']
})
export class SendConfirmationComponent implements OnInit {

  @Input() transaction: any;
  @Input() transactionFee: any;
  @Input() hasOpReturn: boolean;

  constructor(private globalService: GlobalService, public activeModal: NgbActiveModal) {
  }

  public showDetails = false;
  public coinUnit: string;

  ngOnInit(): void {
    this.coinUnit = this.globalService.getCoinUnit();
    this.transactionFee = new CoinNotationPipe().transform(this.transactionFee);
    this.transaction.amount = +this.transaction.recipients[0].amount + +this.transactionFee;
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }
}
