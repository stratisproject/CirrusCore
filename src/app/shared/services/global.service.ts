import { Injectable } from '@angular/core';
import { ElectronService } from '@shared/services/electron.service';
import { WalletInfo } from '@shared/models/wallet-info';
import { BehaviorSubject, Observable } from 'rxjs';
import { VERSION } from '../../../environments/version';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  constructor(private electronService: ElectronService) {
    this.setApplicationVersion();
    this.setTestnetEnabled();
    this.setApiPort();
    this.setDaemonIP();
  }

  private applicationVersion = '2.0.1';
  private gitCommit = "";
  private testnet = false;
  private cirrusMainApiPort = 37223;
  private cirrusTestApiPort = 38223;
  private apiPort: number;
  private walletPath: string;
  private currentWalletName: string;
  private network: string;
  private daemonIP: string;
  private version = VERSION;

  public coinUnit: string;

  public currentWallet: Observable<WalletInfo> = new BehaviorSubject<WalletInfo>(null);

  public getApplicationVersion(): string {
    return this.applicationVersion;
  }

  public setApplicationVersion(): void {
    if (this.electronService.isElectron) {
      this.applicationVersion = this.electronService.remote.app.getVersion();
    }
  }

  public getGitCommit(): string {
    return this.gitCommit;
  }

  public setGitCommit(): void {
    this.gitCommit = this.version.hash;
  }

  public getTestnetEnabled(): boolean {
    return this.testnet;
  }

  public setTestnetEnabled(): void {
    if (this.electronService.isElectron) {
      this.testnet = this.electronService.ipcRenderer.sendSync('get-testnet');
    }
  }

  public getApiPort(): number {
    return this.apiPort;
  }

  public setApiPort(): void {
    if (this.electronService.isElectron) {
      this.apiPort = this.electronService.ipcRenderer.sendSync('get-port');
    } else if (this.testnet) {
      this.apiPort = this.cirrusTestApiPort;
    } else if (!this.testnet) {
      this.apiPort = this.cirrusMainApiPort;
    }
  }

  public getWalletPath(): string {
    return this.walletPath;
  }

  public setWalletPath(walletPath: string): void {
    this.walletPath = walletPath;
  }

  public getNetwork(): string {
    return this.network;
  }

  public setNetwork(network: string): void {
    this.network = network;
  }

  public getWalletName(): string {
    return this.currentWalletName;
  }

  public setWalletName(currentWalletName: string): void {
    this.currentWalletName = currentWalletName;
    (<BehaviorSubject<WalletInfo>>this.currentWallet).next(new WalletInfo(currentWalletName));
  }

  public getCoinUnit(): string {
    return this.coinUnit;
  }

  public setCoinUnit(coinUnit: string): void {
    this.coinUnit = coinUnit;
  }

  public getDaemonIP(): string {
    return this.daemonIP;
  }

  public setDaemonIP(): void {
    if (this.electronService.isElectron) {
      this.daemonIP = this.electronService.ipcRenderer.sendSync('get-daemonip');
    } else {
      this.daemonIP = 'localhost';
    }
  }
}
