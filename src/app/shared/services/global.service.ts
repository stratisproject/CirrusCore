import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { WalletInfo } from '@shared/models/wallet-info';
import { BehaviorSubject, Observable } from 'rxjs';

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

  private applicationVersion = '1.5.1';
  private testnet = false;
  private cirrusMainApiPort = 37223;
  private cirrusTestApiPort = 38223;
  private apiPort: number;
  private walletPath: string;
  private currentWalletName: string;
  private network: string;
  private daemonIP: string;

  public coinUnit: string;

  public currentWallet: Observable<WalletInfo> = new BehaviorSubject<WalletInfo>(null);


  public getApplicationVersion() {
    return this.applicationVersion;
  }

  public setApplicationVersion() {
    if (this.electronService.isElectronApp) {
      //this.applicationVersion = this.electronService.remote.app.getVersion();
    }
  }

  public getTestnetEnabled() {
    return this.testnet;
  }

  public setTestnetEnabled() {
    if (this.electronService.isElectronApp) {
      this.testnet = this.electronService.ipcRenderer.sendSync('get-testnet');
    }
  }

  public get networkName() {
    return 'cirrus';
  }

  public getApiPort() {
    return this.apiPort;
  }

  public setApiPort() {
    if (this.electronService.isElectronApp) {
      this.apiPort = this.electronService.ipcRenderer.sendSync('get-port');
    } else if (this.testnet) {
      this.apiPort = this.cirrusTestApiPort;
    } else if (!this.testnet) {
      this.apiPort = this.cirrusMainApiPort;
    }
  }

  public getWalletPath() {
    return this.walletPath;
  }

  public setWalletPath(walletPath: string) {
    this.walletPath = walletPath;
  }

  public getNetwork() {
    return this.network;
  }

  public setNetwork(network: string) {
    this.network = network;
  }

  public getWalletName() {
    return this.currentWalletName;
  }

  public setWalletName(currentWalletName: string) {
    this.currentWalletName = currentWalletName;
    (<BehaviorSubject<WalletInfo>>this.currentWallet).next(new WalletInfo(currentWalletName));
  }

  public getCoinUnit() {
    return this.coinUnit;
  }

  public setCoinUnit(coinUnit: string) {
    this.coinUnit = coinUnit;
  }

  public getDaemonIP() {
    return this.daemonIP;
  }

  public setDaemonIP() {
    if (this.electronService.isElectronApp) {
      this.daemonIP = this.electronService.ipcRenderer.sendSync('get-daemonip');
    } else {
      this.daemonIP = 'localhost';
    }
  }
}
