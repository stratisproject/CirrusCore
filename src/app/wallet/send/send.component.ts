import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ApiService } from '@shared/services/api.service';
import { GlobalService } from '@shared/services/global.service';
import { CoinNotationPipe } from '@shared/pipes/coin-notation.pipe';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FeeEstimation } from '@shared/models/fee-estimation';
import { Transaction } from '@shared/models/transaction';
import { WalletInfoRequest } from '@shared/models/wallet-info';
import { SendConfirmationComponent } from './send-confirmation/send-confirmation.component';
import { Subscription } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import { WalletService } from '@shared/services/wallet.service';
import { SendComponentFormResources } from '../send-component-form-resources';
import { FormHelper } from '@shared/forms/form-helper';
import { TransactionResponse } from '@shared/models/transaction-response';
import { CurrentAccountService } from "@shared/services/current-account.service";
import { Network } from '@shared/models/network';

@Component({
  selector: 'send-component',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.css'],
})

export class SendComponent implements OnInit, OnDestroy {
  private accountsEnabled: boolean;
  public networks: Network[];
  public testnetEnabled: boolean;

  constructor(
    private apiService: ApiService,
    public walletService: WalletService,
    private globalService: GlobalService,
    private modalService: NgbModal,
    private currentAccountService: CurrentAccountService,
    public activeModal: NgbActiveModal,
    private fb: FormBuilder) {

    this.sendForm = SendComponentFormResources.buildSendForm(fb,
      () => (this.spendableBalance - this.estimatedFee) / 100000000);

    this.sendToSidechainForm = SendComponentFormResources.buildSendToSidechainForm(fb,
      () => (this.spendableBalance - this.estimatedSidechainFee) / 100000000);

    this.subscriptions.push(this.sendForm.valueChanges.pipe(debounceTime(300)).subscribe(data => this.onSendValueChanged(data, false)));

    this.subscriptions.push(this.sendToSidechainForm.valueChanges.pipe(debounceTime(300)).subscribe(data => this.onSendValueChanged(data, true)));

    this.subscriptions.push(this.sendToSidechainForm.get('networkSelect').valueChanges.subscribe(() => this.networkSelectChanged()));
  }

  @Input() address: string;

  public sendForm: FormGroup;
  public sendToSidechainForm: FormGroup;
  public coinUnit: string;
  public isSending = false;
  public estimatedFee = 0;
  public estimatedSidechainFee = 0;
  public totalBalance = 0;
  public spendableBalance = 0;
  public apiError: string;
  public firstTitle: string;
  public secondTitle: string;

  // The opReturnAmount is for compatibility with StratisX, opReturnAmount needs to be greater than 0 to pass the MemPool
  // Validation rules.
  public confirmationText: string;
  private subscriptions: Subscription[] = [];
  public sendFormErrors: any = {};
  public sendToSidechainFormErrors: any = {};

  public ngOnInit(): void {
    this.testnetEnabled = this.globalService.getTestnetEnabled();
    this.accountsEnabled = this.currentAccountService.hasActiveAddress();

    if (this.testnetEnabled) {
      this.networks = SendComponentFormResources.cirrusTestNetworks;
    } else {
      this.networks = SendComponentFormResources.cirrusNetworks;
    }

    this.firstTitle = 'Sidechain';
    this.secondTitle = 'Mainchain';

    this.getWalletBalance();
    this.coinUnit = this.globalService.getCoinUnit();
    if (this.address) {
      this.sendForm.patchValue({ 'address': this.address });
    }

    this.confirmationText = "Amounts less than 50 Cirrus clear in 25 confirmations<br>Amounts between 50 and 1000 Cirrus clear in 80 confirmations<br>Amounts more than 1000 Cirrus clear in 500 confirmations";
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private onSendValueChanged(data: any, isSideChain: boolean): void {

    const form = isSideChain ? this.sendToSidechainForm : this.sendForm;
    if (!form) {
      return;
    }

    FormHelper.ValidateForm(form,
      isSideChain ? this.sendToSidechainFormErrors : this.sendFormErrors,
      isSideChain ? SendComponentFormResources.sendToSidechainValidationMessages : SendComponentFormResources.sendValidationMessages
    );

    this.apiError = '';

    const isValidForFeeEstimate = (isSideChain
      ? form.get('destinationAddress').valid && form.get('federationAddress').valid
      : form.get('address').valid) && form.get('amount').valid;

    if (isValidForFeeEstimate) {
      this.estimateFee(form, isSideChain);
    }
  }

  // NB: This is not currently used
  public getMaxBalance(): void {
    let balanceResponse;
    const walletRequest = new WalletInfoRequest(this.globalService.getWalletName(), 0, this.sendForm.get('fee').value);
    this.apiService.getMaximumBalance(walletRequest)
      .pipe(tap(
        response => {
          balanceResponse = response;
        },
        error => {
          this.apiError = error.error.errors[0].message;
        },
        () => {
          this.sendForm.patchValue({ amount: +new CoinNotationPipe().transform(balanceResponse.maxSpendableAmount) });
          this.estimatedFee = balanceResponse.fee;
        }
      )).toPromise();
  }

  public estimateFee(form: FormGroup, isSideChain: boolean): void {

    const transaction = new FeeEstimation(
      this.globalService.getWalletName(),
      'account 0',
      form.get(isSideChain ? 'federationAddress' : 'address').value.trim(),
      form.get('amount').value,
      form.get('fee').value,
      true
    );

    this.walletService.estimateFee(transaction).toPromise()
      .then(response => {
        if (isSideChain) {
          this.estimatedSidechainFee = response;
        } else {
          this.estimatedFee = response;
        }
      },
        error => {
          this.apiError = error.error.errors[0].message;
        }
      );
  }

  public send(sendToSideChain?: boolean): void {
    this.isSending = true;
    this.walletService.sendTransaction(this.getTransaction(sendToSideChain))
      .then(transactionResponse => {
        this.estimatedFee = transactionResponse.transactionFee;
        this.activeModal.close('Close clicked');
        this.openConfirmationModal(transactionResponse);
        this.isSending = false;
      }).catch(error => {
        this.isSending = false;
        this.apiError = error.error.errors[0].message;
      });
  }

  private getTransaction(isSideChain?: boolean): Transaction {
    const form = isSideChain ? this.sendToSidechainForm : this.sendForm;

    return new Transaction(
      this.globalService.getWalletName(),
      'account 0',
      form.get('password').value,
      form.get(isSideChain ? 'federationAddress' : 'address').value.trim(),
      form.get('amount').value,
      // TO DO: use coin notation
      (isSideChain ? this.estimatedSidechainFee : this.estimatedFee) / 100000000,
      true,
      !this.accountsEnabled, // Shuffle Outputs
      isSideChain ? this.sendToSidechainForm.get('destinationAddress').value.trim() : null,
      null,
      null,
      isSideChain
    );
  }

  private getWalletBalance() {
    this.subscriptions.push(this.walletService.walletBalance()
      .subscribe(
        response => {
          if (response) {
            this.totalBalance = response.amountConfirmed + response.amountUnconfirmed;
            this.spendableBalance = response.spendableAmount;
          }
        },
      ));
  }

  private openConfirmationModal(transactionResponse: TransactionResponse) {
    const component = this.modalService
      .open(SendConfirmationComponent, { backdrop: 'static' })
      .componentInstance as SendConfirmationComponent;

    component.transaction = transactionResponse.transaction;
    component.transactionFee = this.estimatedFee ? this.estimatedFee : this.estimatedSidechainFee;
    component.hasOpReturn = transactionResponse.isSideChain;
  }

  private networkSelectChanged(): void {
    if (this.sendToSidechainForm.get('networkSelect').value && this.sendToSidechainForm.get('networkSelect').value !== 'customNetwork') {
      this.sendToSidechainForm.patchValue({ 'federationAddress': this.sendToSidechainForm.get('networkSelect').value });
    } else if (this.sendToSidechainForm.get('networkSelect').value && this.sendToSidechainForm.get('networkSelect').value === 'customNetwork') {
      this.sendToSidechainForm.patchValue({ 'federationAddress': '' });
    }
  }
}
