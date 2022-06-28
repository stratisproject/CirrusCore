import { TokenType } from '@shared/models/token-type';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '@shared/components/confirmation-modal/confirmation-modal.component';
import { GlobalService } from '@shared/services/global.service';
import { ModalService } from '@shared/services/modal.service';
import { ClipboardService } from 'ngx-clipboard';
import {
  forkJoin,
  interval,
  Observable,
  of,
  ReplaySubject,
  Subject,
  throwError,
} from 'rxjs';
import { catchError, first, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Mode, TransactionComponent } from '../../smart-contracts/components/modals/transaction/transaction.component';
import { SmartContractsServiceBase } from '@shared/services/smart-contracts.service';
import { Disposable } from '../models/disposable';
import { Mixin } from '../models/mixin';
import { SavedToken, Token } from '../models/token';
import { TokenBalanceRequest } from '../models/token-balance-request';
import { LoggerService } from '@shared/services/logger.service';
import { pollWithTimeOut } from '../services/polling';
import { TokensService } from '../services/tokens.service';
import { AddTokenComponent } from './add-token/add-token.component';
import { ProgressComponent } from './progress/progress.component';
import { SendTokenComponent } from './send-token/send-token.component';
import { SendInterfluxTokenComponent } from './send-token/send-interflux/send-interflux-token.component';
import { CurrentAccountService } from '@shared/services/current-account.service';
import { WalletService } from '@shared/services/wallet.service';

@Component({
  selector: 'app-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.css']
})
@Mixin([Disposable])
export class TokensComponent implements OnInit, OnDestroy, Disposable {
  balance: number;
  coinUnit: string;
  tokenBalanceRefreshRequested$ = new Subject<SavedToken[]>();
  addresses: string[];
  disposed$ = new ReplaySubject<boolean>();
  dispose: () => void;
  selectedAddress: string;
  walletName: string;
  tokens$: Observable<SavedToken[]>;
  private pollingInterval = 10 * 1000; // polling milliseconds
  maxTimeout = 1.5 * 60 * 1000; // wait for about 1.5 minutes
  tokens: SavedToken[] = [];
  tokenLoading: { [address: string]: string; } = {};
  public tooltipText = "This is the token contract address. Tokens sent to this address will be lost, do not use this as your receive address.";

  constructor(
    private tokenService: TokensService,
    private smartContractsService: SmartContractsServiceBase,
    private clipboardService: ClipboardService,
    private genericModalService: ModalService,
    private modalService: NgbModal,
    private globalService: GlobalService,
    private currentAccountService: CurrentAccountService,
    private loggerService: LoggerService,
    private walletService: WalletService) {

    this.walletName = this.globalService.getWalletName();
    this.coinUnit = this.globalService.getCoinUnit();
    this.selectedAddress = this.currentAccountService.address;
    this.walletService.getSmartContractAddressBalance().subscribe(balance => this.balance = balance);

    // Update requested token balances
    this.tokenBalanceRefreshRequested$
      .pipe(
        tap(tokensToReload => tokensToReload.forEach(t => t.clearBalance())),
        switchMap(tokensToReload => this.updateTokenBalances(tokensToReload)),
        takeUntil(this.disposed$)
      )
      .subscribe();

    interval(this.pollingInterval)
      .pipe(
        switchMap(() => this.updateTokenBalances(this.tokens)),
        takeUntil(this.disposed$)
      )
      .subscribe();
  }

  async ngOnInit(): Promise<any> {
    // Clear all the balances to start with
    const tokens = await this.tokenService.GetSavedTokens();
    tokens.forEach(t => t.clearBalance());
    this.tokens = tokens;

    // Refresh them all
    this.tokenBalanceRefreshRequested$.next(this.tokens);
  }

  ngOnDestroy(): void {
    this.dispose();
  }

  private updateTokenBalances(tokens: SavedToken[]) {
    const tokensWithAddresses = tokens.filter(token => !!token.address);
    tokensWithAddresses.forEach(token => this.tokenLoading[token.address] = 'loading');
    return forkJoin(tokensWithAddresses.map(token => {
      return this.tokenService
        .GetTokenBalance(new TokenBalanceRequest(token.address, this.selectedAddress))
        .pipe(
          catchError(error => {
            this.loggerService.error(error);
            this.loggerService.log(`Error getting token balance for token address ${token.address}`);
            token.clearBalance();
            this.tokenLoading[token.address] = 'error';
            return of(BigInt(0));
          }),
          tap((balance: BigInt) => {
            this.tokenLoading[token.address] = 'loaded';

            if (balance.toString() !== token.balance) {
              token.setBalance(balance.toString());
            }
          }));
    }));
  }

  showApiError(error: string): void {
    this.genericModalService.openModal('Error', error);
  }

  clipboardAddressClicked(): void {
    if (this.selectedAddress && this.clipboardService.copyFromContent(this.selectedAddress)) {
      this.loggerService.info(`Copied ${this.selectedAddress} to clipboard`);
    }
  }

  copyTokenAddress(address: string): void {
    if (this.clipboardService.copyFromContent(address)) {
      this.loggerService.info(`Copied ${this.selectedAddress} to clipboard`);
    }
  }

  addToken(): void {
    const modal = this.modalService.open(AddTokenComponent, { backdrop: 'static', keyboard: false });
    modal.result.then(value => {
      if (value) {

        this.loggerService.info('Refresh token list');

        this.tokens.push(value);
        this.tokenBalanceRefreshRequested$.next([value]);
      }
    });
  }

  issueToken(): void {
    const modal = this.modalService.open(TransactionComponent, { backdrop: 'static', keyboard: false });
    (<TransactionComponent>modal.componentInstance).mode = Mode.IssueToken;
    (<TransactionComponent>modal.componentInstance).selectedSenderAddress = this.selectedAddress;
    (<TransactionComponent>modal.componentInstance).balance = this.balance;
    (<TransactionComponent>modal.componentInstance).coinUnit = this.coinUnit;
    modal.result.then(value => {
      if (!value || !value.symbol || !value.transactionHash || !value.name) {
        return;
      }

      // start monitoring token progress
      const progressModal = this.modalService.open(ProgressComponent, { backdrop: 'static', keyboard: false });
      (<ProgressComponent>progressModal.componentInstance).loading = true;
      (<ProgressComponent>progressModal.componentInstance).title = 'Waiting for Confirmation';
      (<ProgressComponent>progressModal.componentInstance).message = 'Your token creation transaction has been broadcast and is waiting to be mined. This window will close once the transaction receives one confirmation.';
      (<ProgressComponent>progressModal.componentInstance).close.subscribe(() => progressModal.close());

      const receiptQuery = this.smartContractsService.GetReceiptSilent(value.transactionHash)
        .pipe(
          catchError(() => {
            // Receipt API returns a 400 if the receipt is not found.
            this.loggerService.log(`Receipt not found yet`);
            return of(undefined);
          })
        );

      pollWithTimeOut(this.pollingInterval, this.maxTimeout, receiptQuery)
        .pipe(
          first(r => !!r),
          switchMap(result => {
            // Timeout returns null after completion, use this to throw an error to be handled by the subscriber.
            if (result == null) {
              return throwError(`It seems to be taking longer to issue a token. Please go to "Smart Contracts" tab
                to monitor transactions and check the progress of the token issuance. Once successful, add token manually.`);
            }

            return of(result);
          }),
          switchMap(receipt => receipt.error ? throwError(receipt.error) : of(receipt)),
          takeUntil(this.disposed$)
        )
        .subscribe(
          receipt => {
            const newTokenAddress = receipt['newContractAddress'];
            const token = new SavedToken(value.symbol, newTokenAddress, "0", value.name, value.decimals, TokenType.IStandardToken256, false);
            this.tokenService.AddToken(token);
            progressModal.close('ok');
            this.tokens.push(token);
            this.tokenBalanceRefreshRequested$.next([token]);
          },
          error => {
            this.showError(error);
            this.loggerService.error(error);
            progressModal.close('ok');
          }
        );
    });
  }

  showError(error: string): void {
    this.genericModalService.openModal('Error', error);
  }

  async delete(item: SavedToken): Promise<any> {
    const modal = this.modalService.open(ConfirmationModalComponent, { backdrop: 'static', keyboard: false });

    (<ConfirmationModalComponent>modal.componentInstance).body = `Are you sure you want to remove "${item.ticker}" token`;

    modal.result.then(async value => {
      if (!value) { return; }
      const removeResult = await this.tokenService.RemoveToken(item);
      if (removeResult.failure) {
        this.showApiError(removeResult.message);
        return;
      }

      this.tokens.splice(this.tokens.indexOf(item), 1);
    });
  }

  send(item: SavedToken): void {

    const modal = this.modalService.open(SendTokenComponent, { backdrop: 'static', keyboard: false });
    (<SendTokenComponent>modal.componentInstance).walletName = this.walletName;
    (<SendTokenComponent>modal.componentInstance).selectedSenderAddress = this.selectedAddress;
    (<SendTokenComponent>modal.componentInstance).balance = this.balance;
    (<SendTokenComponent>modal.componentInstance).coinUnit = this.coinUnit;
    (<SendTokenComponent>modal.componentInstance).token = item;
    modal.result.then(value => {

      if (!value || !value.callResponse) {
        return;
      }

      // start monitoring token progress
      const progressModal = this.modalService.open(ProgressComponent, { backdrop: 'static', keyboard: false });
      (<ProgressComponent>progressModal.componentInstance).loading = true;
      (<ProgressComponent>progressModal.componentInstance).close.subscribe(() => progressModal.close());
      (<ProgressComponent>progressModal.componentInstance).title = 'Waiting For Confirmation';
      // tslint:disable-next-line:max-line-length
      (<ProgressComponent>progressModal.componentInstance).message = 'Your token transfer transaction has been broadcast and is waiting to be mined. This window will close once the transaction receives one confirmation.';
      (<ProgressComponent>progressModal.componentInstance).summary = `Send ${String(value.amount)} ${item.name} to ${String(value.recipientAddress)}`;

      const receiptQuery = this.smartContractsService.GetReceiptSilent(value.callResponse.transactionId)
        .pipe(
          catchError(() => {
            // Receipt API returns a 400 if the receipt is not found.
            this.loggerService.log(`Receipt not found yet`);
            return of(undefined);
          })
        );

      pollWithTimeOut(this.pollingInterval, this.maxTimeout, receiptQuery)
        .pipe(
          first(r => !!r),
          switchMap(result => {
            // Timeout returns null after completion, use this to throw an error to be handled by the subscriber.
            if (result === null) {
              return throwError(`It seems to be taking longer to transfer tokens. Please go to "Smart Contracts" tab
                to monitor transactions and check the progress of the token transfer.`);
            }

            return of(result);
          }),
          takeUntil(this.disposed$)
        )
        .subscribe(
          receipt => {

            if (receipt.error) {
              this.showError(receipt.error);
              this.loggerService.error(new Error(receipt.error));
            }

            if (receipt.returnValue === 'False') {
              const sendFailedError = 'Sending tokens failed! Check the amount you are trying to send is correct.';
              this.showError(sendFailedError);
              this.loggerService.error(new Error(sendFailedError));
            }

            progressModal.close('ok');
            this.tokenBalanceRefreshRequested$.next([item]);
          },
          error => {
            this.showError(error);
            this.loggerService.error(error);
            progressModal.close('ok');
          }
        );
    });
  }

  sendinterflux(item: SavedToken): void {

    const modal = this.modalService.open(SendInterfluxTokenComponent, { backdrop: 'static', keyboard: false });

    (<SendInterfluxTokenComponent>modal.componentInstance).walletName = this.walletName;
    (<SendInterfluxTokenComponent>modal.componentInstance).selectedSenderAddress = this.selectedAddress;
    (<SendInterfluxTokenComponent>modal.componentInstance).balance = this.balance;
    (<SendInterfluxTokenComponent>modal.componentInstance).coinUnit = this.coinUnit;
    (<SendInterfluxTokenComponent>modal.componentInstance).token = item;

    modal.result.then(value => {

      if (!value || !value.callResponse) {
        return;
      }

      // start monitoring token progress
      const progressModal = this.modalService.open(ProgressComponent, { backdrop: 'static', keyboard: false });
      (<ProgressComponent>progressModal.componentInstance).loading = true;
      (<ProgressComponent>progressModal.componentInstance).close.subscribe(() => progressModal.close());
      (<ProgressComponent>progressModal.componentInstance).title = 'Waiting For Confirmation';
      // tslint:disable-next-line:max-line-length
      (<ProgressComponent>progressModal.componentInstance).message = 'Your token transfer transaction has been broadcast and is waiting to be mined. This window will close once the transaction receives one confirmation.';
      (<ProgressComponent>progressModal.componentInstance).summary = `Send ${String(value.amount)} ${item.name} to ${String(value.recipientAddress)}`;

      const receiptQuery = this.smartContractsService.GetReceiptSilent(value.callResponse.transactionId)
        .pipe(
          catchError(() => {
            // Receipt API returns a 400 if the receipt is not found.
            this.loggerService.log(`Receipt not found yet`);
            return of(undefined);
          })
        );

      pollWithTimeOut(this.pollingInterval, this.maxTimeout, receiptQuery)
        .pipe(
          first(r => !!r),
          switchMap(result => {
            // Timeout returns null after completion, use this to throw an error to be handled by the subscriber.
            if (result === null) {
              return throwError(`It seems to be taking longer to transfer tokens. Please go to "Smart Contracts" tab
                to monitor transactions and check the progress of the token transfer.`);
            }

            return of(result);
          }),
          takeUntil(this.disposed$)
        )
        .subscribe(
          receipt => {

            if (receipt.error) {
              this.showError(receipt.error);
              this.loggerService.error(new Error(receipt.error));
            }

            if (receipt.returnValue === 'False') {
              const sendFailedError = 'Sending tokens failed! Check the amount you are trying to send is correct.';
              this.showError(sendFailedError);
              this.loggerService.error(new Error(sendFailedError));
            }

            progressModal.close('ok');
            this.tokenBalanceRefreshRequested$.next([item]);
          },
          error => {
            this.showError(error);
            this.loggerService.error(error);
            progressModal.close('ok');
          }
        );
    });
  }
}