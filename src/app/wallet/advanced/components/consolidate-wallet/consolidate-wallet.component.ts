import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '@shared/components/confirmation-modal/confirmation-modal.component';
import { AuthenticationService } from '@shared/services/auth.service';
import { GlobalService } from '@shared/services/global.service';
import { WalletService } from '@shared/services/wallet.service';

@Component({
  selector: 'app-remove-wallet',
  templateUrl: './remove-wallet.component.html',
  styleUrls: ['./remove-wallet.component.css']
})
export class RemoveWalletComponent implements OnInit {
  constructor(
    private walletService: WalletService,
    private globalService: GlobalService,
    private modalService: NgbModal,
    private router: Router,
    private authenticationService: AuthenticationService
  ) { }

  private currentWalletName: string;

  ngOnInit(): void {
    this.currentWalletName = this.globalService.getWalletName();
  }

  public removeWallet(): void {
    const modal = this.modalService.open(ConfirmationModalComponent, {
      backdrop: 'static',
    });

    const instance = modal.componentInstance;
    instance.title = 'Remove wallet';
    instance.body = `Are you sure you want to remove ${this.currentWalletName}? This action is irreversible.`;
    instance.confirmSnackBarMessage = `${this.currentWalletName} has been removed.`;

    modal.result.then(confirmed => {
      if (confirmed) {
        this.walletService.removeWallet(this.currentWalletName).toPromise().then(() => {
          this.walletService.clearWalletHistory();
          this.authenticationService.SignOut();
          this.router.navigate(['/login']);
        });
      }
    });
  }
}
