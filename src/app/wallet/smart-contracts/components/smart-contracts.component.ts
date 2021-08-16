import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { ClipboardService } from 'ngx-clipboard';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { SmartContractsServiceBase, ContractTransactionItem } from '@/shared/services/smart-contracts.service';
import { GlobalService } from '@shared/services/global.service';
import { TransactionComponent, Mode } from './modals/transaction/transaction.component';
import { ModalService } from '@shared/services/modal.service';
import { CurrentAccountService } from '@shared/services/current-account.service';
import { WalletService } from '@shared/services/wallet.service';

@Component({
  selector: 'app-smart-contracts',
  templateUrl: './smart-contracts.component.html',
  styleUrls: ['./smart-contracts.component.css']
})

export class SmartContractsComponent implements OnInit, OnDestroy {

  addressChangedSubject: Subject<string>;
  balance: number;
  selectedAddress: string;

  private history: ContractTransactionItem[];

  coinUnit: string;
  unsubscribe: Subject<void> = new Subject();

  constructor(
    private globalService: GlobalService,
    private smartContractsService: SmartContractsServiceBase,
    private clipboardService: ClipboardService,
    private modalService: NgbModal,
    private genericModalService: ModalService,
    private currentAccountService: CurrentAccountService,
    public walletService: WalletService) {

    this.coinUnit = this.globalService.getCoinUnit();
    this.selectedAddress = this.currentAccountService.address;
  }

  ngOnInit(): void {
    this.walletService.getSmartContractHistory().subscribe(history => this.history = history);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  showApiError(error: string): void {
    this.genericModalService.openModal('Error', error);
  }

  clipboardAddressClicked(): void {
    if (this.selectedAddress && this.clipboardService.copyFromContent(this.selectedAddress)) {
      console.log(`Copied ${this.selectedAddress} to clipboard`);
    }
  }

  callTransactionClicked(): void {
    this.showModal(Mode.Call);
  }

  createNewTransactionClicked(): void {
    this.showModal(Mode.Create);
  }

  showModal(mode: Mode): void {
    const modal = this.modalService.open(TransactionComponent, { backdrop: 'static', keyboard: false });
    (<TransactionComponent>modal.componentInstance).mode = mode;
    (<TransactionComponent>modal.componentInstance).selectedSenderAddress = this.selectedAddress;
    (<TransactionComponent>modal.componentInstance).balance = this.balance;
    (<TransactionComponent>modal.componentInstance).coinUnit = this.coinUnit;
  }

  txHashClicked(contract: ContractTransactionItem): void {
    console.log('txhash clicked');
    this.smartContractsService
      .GetReceipt(contract.hash)
      .toPromise()
      .then(result => {
        // tslint:disable-next-line:max-line-length
        this.genericModalService.openModal('Receipt', '<pre class=\'selectable\'>' + JSON.stringify(result, null, '    ') + '</pre>');
      },
        error => {
          this.showApiError(`Error retrieving receipt. ${String(error)}`);
        });
  }
}
