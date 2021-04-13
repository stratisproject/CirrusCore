import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { GlobalService } from '@shared/services/global.service';
import { ModalService } from '@shared/services/modal.service';
import { WalletResync } from '@shared/models/wallet-rescan';
import { WalletService } from '@shared/services/wallet.service';

@Component({
  selector: 'app-resync',
  templateUrl: './resync.component.html',
  styleUrls: ['./resync.component.css']
})
export class ResyncComponent implements OnInit {
  @Output() rescanStarted = new EventEmitter<boolean>();

  constructor(
    private globalService: GlobalService,
    public walletService: WalletService,
    private genericModalService: ModalService) {
  }

  private walletName: string;

  ngOnInit(): void {
    this.walletName = this.globalService.getWalletName();
  }

  public onResyncClicked(): void {
    const rescanData = new WalletResync(
      this.walletName,
      true,
      true
    );

    this.walletService
      .rescanWallet(rescanData)
      .toPromise().then(
        () => {
          this.genericModalService.openModal('Resyncing', 'Your wallet is now resyncing. The time remaining depends on the size and creation time of your wallet. The wallet dashboard shows your progress.');
        }
      );
  }
}
