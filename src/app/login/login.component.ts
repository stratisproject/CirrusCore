import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalService } from '@shared/services/global.service';
import { ApiService } from '@shared/services/api.service';
import { ModalService } from '@shared/services/modal.service';
import { WalletLoad } from '@shared/models/wallet-load';
import { Subscription } from 'rxjs';
import { WalletService } from '@shared/services/wallet.service';
import { AuthenticationService } from '@shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit, OnDestroy {
  public openWalletForm: FormGroup;
  public wallets: string[];
  private subscriptions: Subscription[] = [];

  public formErrors = {
    'password': ''
  };

  public validationMessages = {
    'password': {
      'required': 'Please enter your password.'
    }
  };

  constructor(
    private globalService: GlobalService,
    private apiService: ApiService,
    private walletService: WalletService,
    private genericModalService: ModalService,
    private router: Router,
    private fb: FormBuilder,
    private authenticationService: AuthenticationService) {

    this.buildDecryptForm();
  }

  public hasWallet = false;
  public isDecrypting = false;


  public ngOnInit(): void {
    this.getWalletFiles();
    this.getCurrentNetwork();
  }

  private buildDecryptForm(): void {
    this.openWalletForm = this.fb.group({
      // eslint-disable-next-line @typescript-eslint/unbound-method
      'selectWallet': [{ value: '', disabled: this.isDecrypting }, Validators.required],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      'password': [{ value: '', disabled: this.isDecrypting }, Validators.required]
    });

    this.subscriptions.push(this.openWalletForm.valueChanges
      .subscribe(() => this.onValueChanged()));

    this.onValueChanged();
  }

  private onValueChanged(): void {
    if (!this.openWalletForm) {
      return;
    }
    const form = this.openWalletForm;
    for (const field in this.formErrors) {
      this.formErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.validationMessages[field];
        for (const key in control.errors) {
          this.formErrors[field] += `${String(messages[key])} `;
        }
      }
    }
  }

  private getWalletFiles(): void {
    const subscription = this.walletService.getWalletNames()
      .subscribe(
        response => {
          this.wallets = response.walletNames.sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1);
          if (this.wallets.length > 0) {
            this.hasWallet = true;
          } else {
            this.hasWallet = false;
          }
        }
      );

    this.subscriptions.push(subscription);
  }

  public onCreateClicked(): void {
    this.router.navigate(['setup']);
  }

  public onEnter(): void {
    if (this.openWalletForm.valid) {
      this.onDecryptClicked();
    }
  }

  public onDecryptClicked(): void {
    this.isDecrypting = true;
    this.globalService.setWalletName(this.openWalletForm.get('selectWallet').value);
    const walletLoad = new WalletLoad(
      this.openWalletForm.get('selectWallet').value,
      this.openWalletForm.get('password').value
    );
    this.loadWallet(walletLoad);
  }

  private loadWallet(walletLoad: WalletLoad): void {
    this.apiService.loadStratisWallet(walletLoad)
      .subscribe(
        () => {
          this.authenticationService.SignIn();
          this.router.navigate(['address-selection']);
        },
        () => {
          this.isDecrypting = false;
        }
      );
  }

  private getCurrentNetwork(): void {
    this.apiService.getNodeStatus(false, false)
      .subscribe(
        response => {
          this.globalService.setCoinUnit(response.coinTicker);
          this.globalService.setNetwork(response.network);
        }
      );
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
