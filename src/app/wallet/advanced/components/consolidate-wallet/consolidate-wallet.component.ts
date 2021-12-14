import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '@shared/components/confirmation-modal/confirmation-modal.component';
import { GlobalService } from '@shared/services/global.service';
import { WalletService } from '@shared/services/wallet.service';
import { CurrentAccountService } from '@shared/services/current-account.service';
import { ApiService } from '@shared/services/api.service';

@Component({
  selector: 'app-consolidate-wallet',
  templateUrl: './consolidate-wallet.component.html',
  styleUrls: ['./consolidate-wallet.component.css']
})
export class ConsolidateWalletComponent implements OnInit {
  constructor(
    public currentAccountService: CurrentAccountService,
    private apiService: ApiService,
    private globalService: GlobalService,
    private modalService: NgbModal,
    private router: Router,
  ) {
    this.currentAccountService = currentAccountService;
  }

  private currentWalletName: string;

  ngOnInit(): void {
    this.currentWalletName = this.globalService.getWalletName();
  }

  public consolidateWallet(): void {
    const modal = this.modalService.open(ConfirmationModalComponent, {
      backdrop: 'static',
    });

    const instance = modal.componentInstance;
    instance.title = 'Consolidate wallet';
    instance.body = `Are you sure you wish to consolidate all unspent UTXOs to address ${this.currentAccountService.address}?.`;
    instance.confirmSnackBarMessage = `Consolidation to address ${this.currentAccountService.address} has started, please be patient.`;

    modal.result.then(confirmed => {

      if (confirmed) {
        if (this.currentAccountService.address != null)
          this.apiService.consolidateWallet(this.currentWalletName).toPromise().then(() => {
            //this.router.navigate(['/login']);
          });
      }
    });
  }
}
