import { Component, OnDestroy, OnInit } from '@angular/core';
import { GlobalService } from '@shared/services/global.service';
import { ClipboardService } from 'ngx-clipboard';
import { catchError, takeUntil } from 'rxjs/operators';
import { of, Subject, Observable } from 'rxjs';
import { CurrentAccountService } from '@shared/services/current-account.service';
import { Router } from '@angular/router';
import { WalletInfo } from '@shared/models/wallet-info';
import { WalletService } from '@shared/services/wallet.service';
import { LoggerService } from '@shared/services/logger.service';

@Component({
  selector: 'app-address-selection',
  templateUrl: './address-selection.component.html',
  styleUrls: ['./address-selection.component.css']
})
export class AddressSelectionComponent implements OnInit, OnDestroy {

  private walletName = '';
  addresses: any[];
  addressChangedSubject: Subject<string>;
  selectedAddress: string;
  coinUnit: string;
  unsubscribe: Subject<void> = new Subject();

  public isLoading = false;

  constructor(private globalService: GlobalService,
    private walletService: WalletService,
    private currentAccountService: CurrentAccountService,
    private router: Router,
    private clipboardService: ClipboardService,
    private loggerService: LoggerService) {

    this.coinUnit = this.globalService.getCoinUnit();
    this.walletName = this.globalService.getWalletName();
    this.addressChangedSubject = new Subject();

    // Show loading icon.
    this.isLoading = true;

    this.walletService
      .getAllAddressesForWallet(new WalletInfo(this.walletName))
      .pipe(
        catchError(error => {
          this.loggerService.error(error);
          this.isLoading = false;
          return of([]);
        }),
        takeUntil(this.unsubscribe))
      .subscribe(addresses => {

        this.isLoading = false;

        if (addresses && addresses.hasOwnProperty('addresses')) {
          if (addresses.addresses.length > 0) {
            this.addressChangedSubject.next(addresses.addresses[0].address);
            this.addresses = addresses.addresses
              .filter(a => a.isChange === false || (a.amountConfirmed > 0 || a.amountUnconfirmed > 0))
              .sort((a, b) => {
                return b.amountConfirmed - a.amountConfirmed;
              });
            this.selectedAddress = this.addresses[0].address;
          }
        }
      });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  getAddress(): string {
    return this.currentAccountService.address;
  }

  addressChanged(address: string): void {
    this.addressChangedSubject.next(address);
  }

  next(): void {
    if (this.selectedAddress) {
      this.currentAccountService.address = this.selectedAddress;
      this.router.navigate(['wallet/dashboard']);
    }
  }

  clipboardAddressClicked(): void {
    if (this.selectedAddress && this.clipboardService.copyFromContent(this.selectedAddress)) {
      this.loggerService.info(`Copied ${this.selectedAddress} to clipboard`);
    }
  }
}
