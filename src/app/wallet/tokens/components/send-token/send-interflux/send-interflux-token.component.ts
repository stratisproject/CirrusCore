import { ApiService } from '@shared/services/api.service';
import { Component, OnInit, Input } from '@angular/core';
import { SavedToken } from '../../../models/token';
import { FormControl, FormArray, Validators, FormGroup } from '@angular/forms';
import { Mixin } from '../../../models/mixin';
import { Disposable } from '../../../models/disposable';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SmartContractsService } from '@shared/services/smart-contracts.service';
import { TokenType } from '@shared/models/token-type';
import { Recipient } from '@shared/models/transaction';
import { GlobalService } from '@shared/services/global.service';
import { SendComponentFormResources } from '../../../../send-component-form-resources';
import { LoggerService } from '@shared/services/logger.service';
import { interval, ReplaySubject, } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

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

  apiError: string;
  coinUnit: string;
  contractAddress: FormControl;
  feeAmount: FormControl;
  interFluxFee: FormControl;
  interFluxFeeLabel: string;
  interFluxFeeCountDown: number = 30;
  gasPrice: FormControl;
  gasLimit: FormControl;
  loading: boolean;
  private multisigAddress: string;
  parameters: FormArray;
  password: FormControl;
  recipientAddress: FormControl;
  tacAgreed: FormControl;
  title: string;

  disposed$ = new ReplaySubject<boolean>();
  private pollingInterval = 30 * 1000; // 30 seconds
  recommendedGasLimit = 250000;
  gasCallLimitMinimum = 10000;
  gasCreateLimitMinimum = 12000;
  gasLimitMaximum = 250000;
  gasPriceMinimum = 1;
  gasPriceMaximum = 10000;
  transactionForm: FormGroup;
  tokenAmount: FormControl;

  constructor(
    private activeModal: NgbActiveModal,
    private apiService: ApiService,
    private globalService: GlobalService,
    private loggerService: LoggerService,
    private smartContractsService: SmartContractsService) { }

  async ngOnInit(): Promise<any> {
    this.title = 'Send token ' + this.token.ticker + ' via Interflux';
    this.registerControls();
    this.contractAddress.setValue(this.token.address);
    this.contractAddress.disable();

    const testnetEnabled = this.globalService.getTestnetEnabled();

    if (testnetEnabled) {
      this.multisigAddress = SendComponentFormResources.cirrusTestNetworks[0].federationAddress;
    } else {
      this.multisigAddress = SendComponentFormResources.cirrusNetworks[0].federationAddress;
    }

    await this.updateInterFluxFee();

    interval(this.pollingInterval)
      .pipe(
        switchMap(() => this.updateInterFluxFee()),
        takeUntil(this.disposed$)
      )
      .subscribe();

    interval(1000)
      .pipe(
        switchMap(() => this.UpdateCountDownLabel()),
        takeUntil(this.disposed$)
      )
      .subscribe();
  }

  closeClicked(): void {
    this.activeModal.close();
  }

  private async UpdateCountDownLabel(): Promise<any> {
    this.interFluxFeeCountDown -= 1;
  }

  private createModel() {
    const tokenValueType = this.token.type === TokenType.IStandardToken256 ? '12' : '7';

    return {
      walletName: this.walletName,
      password: this.password.value,
      accountName: 'account 0',
      contractAddress: this.token.address,
      methodName: 'BurnWithMetadata',
      amount: 0,
      feeAmount: this.feeAmount.value,
      sender: this.selectedSenderAddress,
      gasPrice: this.gasPrice.value,
      gasLimit: this.gasLimit.value,
      recipients: [new Recipient(this.multisigAddress, this.interFluxFee.value)],
      parameters: [
        `${tokenValueType}#${this.token.toScaledAmount(this.tokenAmount.value).toFixed()}`,
        `4#${String(this.recipientAddress.value)}`
      ],
      isInteropFeeForMultisig: true
    };
  }

  onSubmit(): void {
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
    this.tacAgreed = new FormControl(0, [Validators.requiredTrue]);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.tokenAmount = new FormControl(0, [Validators.required, Validators.min(0), Validators.max(Number(this.token.balance)), decimalPlaceValidator]);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.feeAmount = new FormControl(0.001, [Validators.required, amountValidator, Validators.min(0)]);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.interFluxFee = new FormControl(0, [Validators.required, amountValidator, Validators.min(1), Validators.max(Number(this.balance))]);

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
      interFluxFee: this.interFluxFee,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      parameters: this.parameters,
      tokenAmount: this.tokenAmount,
      contractAddress: this.contractAddress,
      recipientAddress: this.recipientAddress,
      password: this.password,
      tacAgreed: this.tacAgreed
    });
  }

  private async updateInterFluxFee(): Promise<any> {
    var result = await this.apiService.getInterFluxFee().toPromise()
    if (result == null) {
      this.interFluxFee.setValue('');
      this.interFluxFeeLabel = '[Could not be determined]';
    }
    else {
      var adjustedFee = ((result.conversionFee * 0.1) + result.conversionFee).toFixed(2);
      this.interFluxFee.setValue(adjustedFee);
      this.interFluxFeeLabel = adjustedFee;
    }

    this.interFluxFeeCountDown = 30;
  }
}