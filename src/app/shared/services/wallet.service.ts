import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { SignalRService } from '@shared/services/signalr-service';
import { WalletInfo } from '@shared/models/wallet-info';
import { TransactionsHistoryItem, WalletBalance, WalletHistory, WalletNamesData } from '@shared/services/interfaces/api.i';
import { SignalREvent, SignalREvents, } from '@shared/services/interfaces/signalr-events.i';
import { catchError, map, flatMap, tap } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RestApi } from '@shared/services/rest-api';
import { GlobalService } from '@shared/services/global.service';
import { ErrorService } from '@shared/services/error-service';
import { LoggerService } from '@shared/services/logger.service';
import { Transaction } from '@shared/models/transaction';
import { TransactionSending } from '@shared/models/transaction-sending';
import { BuildTransactionResponse, TransactionResponse } from '@shared/models/transaction-response';
import { FeeEstimation } from '@shared/models/fee-estimation';
import { CurrentAccountService } from '@shared/services/current-account.service';
import { WalletLoad } from '@shared/models/wallet-load';
import { WalletResync } from '@shared/models/wallet-rescan';
import { NodeService } from '@shared/services/node-service';
import { TransactionInfo } from '@shared/models/transaction-info';
import { ExtPubKeyImport } from '@shared/models/extpubkey-import';
import { ModalService } from '@shared/services/modal.service';
import { ContractTransactionItem } from '@shared/services/smart-contracts.service';

@Injectable({
  providedIn: 'root'
})
export class WalletService extends RestApi {
  public rescanInProgress: boolean;
  private walletBalanceSubjects: { [walletName: string]: BehaviorSubject<WalletBalance> } = {};
  private walletHistorySubjects: { [walletName: string]: BehaviorSubject<TransactionInfo[]> } = {};
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private currentWallet: WalletInfo;
  public accountsEnabled: boolean;
  public isSyncing: boolean;
  public ibdMode: boolean;

  private smartContractAddressBalance = new BehaviorSubject<number>(0);
  private smartContractHistorySubject = new BehaviorSubject<ContractTransactionItem[]>([]);

  public get loading(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  constructor(
    private currentAccountService: CurrentAccountService,
    nodeService: NodeService,
    globalService: GlobalService,
    http: HttpClient,
    errorService: ErrorService,
    loggerService: LoggerService,
    signalRService: SignalRService,
    private genericModalService: ModalService) {
    super(globalService, http, errorService, loggerService);

    globalService.currentWallet.subscribe(wallet => {
      this.currentWallet = wallet;
    });

    // If the address changes update the wallet balance / history etc.
    currentAccountService.currentAddress.subscribe((address) => {
      this.accountsEnabled = true;
      if (address != null) {
        this.updateWalletForCurrentAddress();
      }
    });

    // Listen for any transactions that pertains to this wallet.
    signalRService.registerOnMessageEventHandler<SignalREvent>(SignalREvents.WalletProcessedTransactionOfInterestEvent,
      () => {
        this.updateWalletForCurrentAddress();
      });

    // Update the rescan in progress flag once rescan has completed.
    nodeService.generalInfo().subscribe(generalInfo => {
      if (generalInfo.percentSynced === 100 && this.rescanInProgress) {
        this.rescanInProgress = false;
      }
    });
  }

  public getWalletNames(): Observable<WalletNamesData> {
    return this.get<WalletNamesData>('wallet/list-wallets').pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  public loadStratisWallet(data: WalletLoad): Observable<any> {
    return this.post('wallet/load/', data).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  public removeWallet(walletName: string): Observable<any> {
    const params = new HttpParams()
      .set('walletName', walletName);

    return this.delete('wallet/remove-wallet', params).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }
  public getAllAddressesForWallet(data: WalletInfo): Observable<any> {
    return this.get('wallet/addresses', this.getWalletParams(data)).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  public getUnusedReceiveAddress(data: WalletInfo): Observable<any> {
    return this.get('wallet/unusedaddress', this.getWalletParams(data)).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  public rescanWallet(data: WalletResync): Observable<any> {
    const params = new HttpParams()
      .set('walletName', data.walletName)
      .set('all', data.all.toString())
      .set('reSync', data.reSync.toString());

    return this.delete('wallet/remove-transactions/', params).pipe(
      tap(() => {
        this.rescanInProgress = true;
        this.clearWalletHistory();
        //this.paginateHistory();
        this.getHistory();
      }),
      catchError(err => this.handleHttpError(err))
    );
  }

  public importExtPubKey(data: ExtPubKeyImport): Observable<any> {
    return this.post('wallet/recover-via-extpubkey', data).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  public walletBalance(): Observable<WalletBalance> {
    return this.getWalletBalanceSubject().asObservable();
  }

  public walletHistory(): Observable<TransactionInfo[]> {
    return this.getWalletHistorySubject().asObservable();
  }

  public estimateFee(feeEstimation: FeeEstimation): Observable<any> {

    // TODO: What is the intrinsic link between Smart Contacts and Accounts Enabled?
    if (this.accountsEnabled) {

      feeEstimation.sender = this.currentAccountService.address;
      feeEstimation.shuffleOutputs = false;

      return this.post('smartcontracts/estimate-fee', feeEstimation).pipe(
        catchError(err => this.handleHttpError(err))
      );
    } else {

      feeEstimation.shuffleOutputs = true;

      return this.post('wallet/estimate-txfee', feeEstimation).pipe(
        catchError(err => this.handleHttpError(err))
      );
    }
  }

  public getHistory(): void {

    let extra = Object.assign({}, {}) as { [key: string]: any };

    if (this.accountsEnabled) {
      extra = Object.assign(extra, {
        address: this.currentAccountService.address,
        skip: 0,
        take: 1000
      });
    } else {
      extra = Object.assign(extra, {
        skip: 0,
        take: 1000
      });
    }

    this.loadingSubject.next(true);

    this.get<WalletHistory>('wallet/history', this.getWalletParams(this.currentWallet, extra))
      .pipe(map((response) => {
        return response.history[this.currentWallet.account].transactionsHistory;
      }),
        catchError((err) => {
          this.loadingSubject.next(false);
          return this.handleHttpError(err);
        }))
      .toPromise()
      .then(history => {
        this.applyHistory(history);
        this.loadingSubject.next(false);
      });
  }

  private applyHistory(history: TransactionsHistoryItem[]): void {
    const subject = this.getWalletHistorySubject();
    const existingItems = subject.value;
    const newItems = [];

    // Determine whether or not each item already exists in the cached set.
    history.forEach(item => {
      const index = existingItems.findIndex(existing => existing.id === item.id);

      // If it does not exist, add it.
      if (index === -1) {
        const mapped = TransactionInfo.mapFromTransactionsHistoryItem(item);
        newItems.push(mapped);
      }
      else {
        if (item.confirmedInBlock && !existingItems[index].transactionConfirmedInBlock) {
          existingItems.filter(existing => existing.id === item.id).forEach(existing => {
            existing.transactionConfirmedInBlock = item.confirmedInBlock;
          });
        }
      }
    });
    const set = existingItems.concat(newItems);
    subject.next(set.sort((a, b) => b.timestamp - a.timestamp));
  }

  public broadcastTransaction(transactionHex: string): Observable<string> {
    return this.post('wallet/send-transaction', new TransactionSending(transactionHex)).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  public sendTransaction(transaction: Transaction): Promise<TransactionResponse> {
    return this.buildAndSendTransaction(transaction).toPromise();
  }

  public getTransactionCount(): Observable<number> {
    return this.get<any>('wallet/transactionCount', this.getWalletParams(this.currentWallet))
      .pipe(map(result => {
        return result.transactionCount as number;
      }), catchError(err => this.handleHttpError(err)));
  }

  private buildAndSendTransaction(transaction: Transaction): Observable<TransactionResponse> {

    if (this.accountsEnabled) {
      transaction.shuffleOutputs = !this.accountsEnabled;
      if (this.currentAccountService.hasActiveAddress()) {
        // Only set a change address if we're on a sidechain and there's a current account selected
        transaction.sender = this.currentAccountService.address;
      }
    }

    const observable = this.accountsEnabled
      ? this.post<BuildTransactionResponse>('smartcontracts/build-transaction', transaction)
      : this.post<BuildTransactionResponse>('wallet/build-transaction', transaction);

    return observable.pipe(
      map(response => {
        response.isSideChain = transaction.isSideChainTransaction;
        return response;
      }),
      flatMap((buildTransactionResponse) => {
        return this.post('wallet/send-transaction', new TransactionSending(buildTransactionResponse.hex)).pipe(
          map(() => {
            return new TransactionResponse(transaction, buildTransactionResponse.fee, buildTransactionResponse.isSideChain);
          }),
          tap(() => {
            this.updateWalletForCurrentAddress();
          })
        );
      }),
      catchError(err => this.handleHttpError(err))
    );
  }

  private getWalletBalanceSubject(): BehaviorSubject<WalletBalance> {
    if (!this.walletBalanceSubjects[this.currentWallet.walletName]) {
      this.walletBalanceSubjects[this.currentWallet.walletName] = new BehaviorSubject<WalletBalance>(null);
    }

    return this.walletBalanceSubjects[this.currentWallet.walletName];
  }

  private getWalletHistorySubject(): BehaviorSubject<TransactionInfo[]> {
    if (!this.walletHistorySubjects[this.currentWallet.walletName]) {
      this.walletHistorySubjects[this.currentWallet.walletName] = new BehaviorSubject<TransactionInfo[]>([]);
    }

    return this.walletHistorySubjects[this.currentWallet.walletName];
  }

  private getWalletParams(walletInfo: WalletInfo, extra?: { [key: string]: any }): HttpParams {
    let params = new HttpParams()
      .set('walletName', walletInfo.walletName)
      .set('accountName', `account ${walletInfo.account || 0}`);

    if (extra) {
      Object.keys(extra).forEach(key => {
        if (extra[key] != null) {
          params = params.set(key, extra[key]);
        }
      });
    }
    return params;
  }

  private updateWalletForCurrentAddress(): void {

    if (!this.currentWallet) {
      return;
    }

    const walletBalanceSubject = this.getWalletBalanceSubject();

    const updatedWalletBalance = new WalletBalance(walletBalanceSubject.value, walletBalanceSubject.value ? walletBalanceSubject.value.currentAddress : null);

    if (this.accountsEnabled) {
      if (
        updatedWalletBalance.currentAddress == null ||
        updatedWalletBalance.currentAddress.address !== this.currentAccountService.address) {

        updatedWalletBalance.setCurrentAccountAddress(this.currentAccountService.address);
      }
    }

    this.clearWalletHistory();
    this.getHistory();
    this.updateSmartContractHistory();

    walletBalanceSubject.next(updatedWalletBalance);
  }

  public clearWalletHistory(): void {
    if (this.currentWallet) {
      const walletHistorySubject = this.getWalletHistorySubject();
      walletHistorySubject.next([]);
    }
  }

  public getSmartContractAddressBalance(): Observable<number> {
    return this.smartContractAddressBalance.asObservable();
  }

  public getSmartContractHistory(): Observable<ContractTransactionItem[]> {
    return this.smartContractHistorySubject.asObservable();
  }

  private updateSmartContractHistory(): void {

    // Update th wallet and smart contract address balance
    this.loadingSubject.next(true);

    const params = new HttpParams().set('address', this.currentAccountService.address);
    this.get('wallet/received-by-address', params)
      .pipe(
        map((response) => {
          return response;
        }),
        catchError(err => this.handleHttpError(err))
      ).toPromise()
      .then(balance => {

        this.smartContractAddressBalance.next(balance.amountConfirmed);

        const walletBalanceSubject = this.getWalletBalanceSubject();
        const updatedWalletBalance = new WalletBalance(null, balance.address);
        updatedWalletBalance.amountConfirmed = balance.amountConfirmed;
        updatedWalletBalance.amountUnconfirmed = balance.amountUnconfirmed;
        updatedWalletBalance.spendableAmount = balance.spendableAmount;

        walletBalanceSubject.next(updatedWalletBalance);
        this.loadingSubject.next(false);
      });

    // Update history
    let extra = Object.assign({}, {}) as { [key: string]: any };

    if (this.accountsEnabled) {
      extra = Object.assign(extra, {
        address: this.currentAccountService.address,
        skip: 0,
        take: 1000
      });
    } else {
      extra = Object.assign(extra, {
        skip: 0,
        take: 1000
      });
    }

    this.loadingSubject.next(true);

    this.get<WalletHistory>('smartcontractwallet/history', this.getWalletParams(this.currentWallet, extra))
      .pipe(map((response) => {
        return response;
      }),
        catchError((err) => {
          this.loadingSubject.next(false);
          return this.handleHttpError(err);
        }))
      .toPromise()
      .then(history => {
        this.smartContractHistorySubject.next(history);
        this.loadingSubject.next(false);
      });
  }
}