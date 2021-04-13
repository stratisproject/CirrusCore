import { Component, OnInit } from '@angular/core';
import { ApiService } from '@shared/services/api.service';
import { GlobalService } from '@shared/services/global.service';
import { WalletInfo } from '@shared/models/wallet-info';

@Component({
  selector: 'app-ext-pubkey',
  templateUrl: './ext-pubkey.component.html',
  styleUrls: ['./ext-pubkey.component.css']
})
export class ExtPubkeyComponent implements OnInit {
  constructor(private apiService: ApiService, private globalService: GlobalService) { }

  public extPubKey: string;
  public copied = false;

  ngOnInit(): void {
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    this.getExtPubKey(walletInfo);
  }

  private getExtPubKey(walletInfo: WalletInfo): void {
    this.apiService.getExtPubkey(walletInfo)
      .toPromise().then(
        response => {
          if (response) {
            this.extPubKey = response;
          }
        }
      );
  }

  public onCopiedClick(): void {
    this.copied = true;
  }
}
