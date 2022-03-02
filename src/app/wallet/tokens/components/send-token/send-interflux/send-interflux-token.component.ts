import { Component, OnInit, Input } from '@angular/core';
import { SavedToken } from '../../../models/token';
import { FormControl, FormArray, Validators, FormGroup } from '@angular/forms';
import { Mixin } from '../../../models/mixin';
import { Disposable } from '../../../models/disposable';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SmartContractsService } from '@shared/services/smart-contracts.service';
import { TokenType } from '@shared/models/token-type';

@Component({
  selector: 'app-send-token',
  templateUrl: './send-interflux-token.component.html',
  styleUrls: ['./send-interflux-token.component.css']
})
@Mixin([Disposable])
export class SendInterfluxTokenComponent implements OnInit {

  @Input()
  selectedSenderAddress: string;

  @Input()
  token: SavedToken;

  @Input()
  walletName: string;

  balance = 0;

  title: string;

  parameters: FormArray;
  feeAmount: FormControl;
  gasPrice: FormControl;
  gasLimit: FormControl;
  contractAddress: FormControl;
  recipientAddress: FormControl;
  password: FormControl;
  coinUnit: string;
  loading: boolean;
  apiError: string;

  recommendedGasLimit = 15000;
  gasCallLimitMinimum = 10000;
  gasCreateLimitMinimum = 12000;
  gasLimitMaximum = 250000;
  gasPriceMinimum = 1;
  gasPriceMaximum = 10000;
  transactionForm: FormGroup;
  tokenAmount: FormControl;

  constructor(private activeModal: NgbActiveModal, private smartContractsService: SmartContractsService) { }

  ngOnInit(): void {
    this.title = 'Send token ' + this.token.ticker;
    this.registerControls();
    this.contractAddress.setValue(this.token.address);
    this.contractAddress.disable();
  }

  closeClicked(): void {
    this.activeModal.close();
  }

  private createModel() {
    const tokenValueType = this.token.type === TokenType.IStandardToken256 ? '12' : '7';

    return {
      amount: 0,
      contractAddress: this.token.address,
      feeAmount: this.feeAmount.value,
      gasPrice: this.gasPrice.value,
      gasLimit: this.gasLimit.value,
      parameters: [
        `9#${String(this.recipientAddress.value)}`,
        `${tokenValueType}#${this.token.toScaledAmount(this.tokenAmount.value).toFixed()}`
      ],
      methodName: 'TransferTo',
      password: this.password.value,
      walletName: this.walletName,
      sender: this.selectedSenderAddress
    };
  }

  onSubmit(): void {
    // Hack the parameters into a format the API expects
    const result = this.createModel();

    this.loading = true;

    this.title = 'Sending token ' + this.token.ticker + '...';

    // We don't need an observable here so let's treat it as a promise.
    this.smartContractsService.PostCall(result)
      .toPromise()
      .then(callResponse => {
        this.loading = false;
        this.activeModal.close({ request: result, callResponse, amount: this.tokenAmount.value, recipientAddress: this.recipientAddress.value });
      },
        error => {
          this.loading = false;
          if (!error.error.errors) {
            if (error.error.value.message) {
              this.apiError = error.error.value.message;
            } else {
              console.log(error);
            }
          } else {
            this.apiError = error.error.errors[0].message;
          }
        });
  }

  setTokenAmount(tokenBalance: string): void {
    this.tokenAmount.setValue(tokenBalance);
  }

  private registerControls() {
    const amountValidator = control => Number(control.value) > this.balance ? { amountError: true } : null;
    const gasPriceTooLowValidator = control => Number(control.value) < this.gasPriceMinimum ? { gasPriceTooLowError: true } : null;
    const gasPriceTooHighValidator = control => Number(control.value) > this.gasPriceMaximum ? { gasPriceTooHighError: true } : null;
    const gasLimitMaximumValidator = control => Number(control.value) > this.gasLimitMaximum ? { gasLimitTooHighError: true } : null;
    // tslint:disable-next-line:max-line-length
    const gasCallLimitMinimumValidator = control => Number(control.value) < this.gasCallLimitMinimum ? { gasCallLimitTooLowError: true } : null;

    const integerValidator = Validators.pattern('^[0-9][0-9]*$');

    const decimalPlaceValidator = Validators.pattern('^[0-9]+(\.[0-9]{0,' + this.token.decimals + '})?$');

    const gasLimitValidator = (gasCallLimitMinimumValidator);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.tokenAmount = new FormControl(0, [Validators.required, Validators.min(0), Validators.max(Number(this.token.balance)), decimalPlaceValidator]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.feeAmount = new FormControl(0.001, [Validators.required, amountValidator, Validators.min(0)]);
    // tslint:disable-next-line:max-line-length
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.gasPrice = new FormControl(100, [Validators.required, integerValidator, Validators.pattern('^[+]?([0-9]{0,})*[.]?([0-9]{0,2})?$'), gasPriceTooLowValidator, gasPriceTooHighValidator, Validators.min(0)]);
    // tslint:disable-next-line:max-line-length
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.gasLimit = new FormControl(this.recommendedGasLimit, [Validators.required, integerValidator, Validators.pattern('^[+]?([0-9]{0,})*[.]?([0-9]{0,2})?$'), gasLimitValidator, gasLimitMaximumValidator, Validators.min(0)]);
    this.parameters = new FormArray([]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.password = new FormControl('', [Validators.required, Validators.nullValidator]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.contractAddress = new FormControl('', [Validators.required, Validators.nullValidator]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.recipientAddress = new FormControl('', [Validators.required, Validators.nullValidator]);
    this.transactionForm = new FormGroup({
      feeAmount: this.feeAmount,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      parameters: this.parameters,
      tokenAmount: this.tokenAmount,
      contractAddress: this.contractAddress,
      recipientAddress: this.recipientAddress,
      password: this.password
    });
  }
}
