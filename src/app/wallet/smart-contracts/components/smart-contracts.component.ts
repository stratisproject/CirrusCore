import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClipboardService } from 'ngx-clipboard';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { CurrentAccountService } from '@shared/services/current-account.service';
import { ErrorService } from '@shared/services/error-service';
import { ElectronService } from '@shared/services/electron.service';
import { GlobalService } from '@shared/services/global.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { LoggerService } from '@shared/services/logger.service';
import { ModalService } from '@shared/services/modal.service';
import { RestApi } from '@shared/services/rest-api';
import { SmartContractsServiceBase, ContractTransactionItem } from '@shared/services/smart-contracts.service';
import { TransactionComponent, Mode } from './modals/transaction/transaction.component';
import { WalletService } from '@shared/services/wallet.service';

@Component({
  selector: 'app-smart-contracts',
  templateUrl: './smart-contracts.component.html',
  styleUrls: ['./smart-contracts.component.css']
})

export class SmartContractsComponent extends RestApi implements OnInit, OnDestroy {

  addressChangedSubject: Subject<string>;
  balance: number;
  globalService: GlobalService;
  selectedAddress: string;
  history: ContractTransactionItem[];
  coinUnit: string;
  unsubscribe: Subject<void> = new Subject();

  initializedContracts: string[] = [];

  constructor(
    private clipboardService: ClipboardService,
    private currentAccountService: CurrentAccountService,
    private electronService: ElectronService,
    errorService: ErrorService,
    private genericModalService: ModalService,
    globalService: GlobalService,
    http: HttpClient,
    loggerService: LoggerService,
    private modalService: NgbModal,
    private smartContractsService: SmartContractsServiceBase,
    private walletService: WalletService) {

    super(globalService, http, errorService, loggerService);

    this.globalService = globalService;
    this.coinUnit = globalService.getCoinUnit();
    this.selectedAddress = this.currentAccountService.address;
  }

  ngOnInit(): void {
    this.walletService.getSmartContractAddressBalance().subscribe(balance => this.balance = balance);
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

  openContractPage(contract: ContractTransactionItem): void {

    if (this.initializedContracts.find(c => c == contract.to) == null) {

      const walletLoad = new AddContract(contract.to);

      this
        .post('swagger/contracts', walletLoad)
        .pipe(catchError(err => this.handleHttpError(err)))
        .toPromise()
        .then(() => {
          this.initializedContracts.push(contract.to);
        });;
    }

    const { shell } = require('electron');
    console.log(`http://localhost:${this.globalService.getApiPort()}/swagger/index.html?urls.primaryName=Contract%20${contract.to}`);
    shell.openExternal(`http://localhost:${this.globalService.getApiPort()}/swagger/index.html?urls.primaryName=Contract%20${contract.to}`);
  }

  public openTransactionId(txHash: string): void {

    if(this.globalService.getTestnetEnabled())
      this.electronService.shell.openExternal("https://chainz.cryptoid.info/cirrus-test/tx.dws?" + txHash + ".htm");
    else
      this.electronService.shell.openExternal("https://chainz.cryptoid.info/cirrus/tx.dws?" + txHash + ".htm");
  }
}

class AddContract {
  constructor(address: string) {
    this.address = address;
  }

  public address: string;
}
