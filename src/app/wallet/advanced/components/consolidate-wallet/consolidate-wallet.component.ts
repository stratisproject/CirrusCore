import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationModalComponent } from '@shared/components/confirmation-modal/confirmation-modal.component';
import { GlobalService } from '@shared/services/global.service';
import { WalletService } from '@shared/services/wallet.service';
import { CurrentAccountService } from '@shared/services/current-account.service';
import { ApiService } from '@shared/services/api.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ConsolidateWalletComponentFormResources } from './consolidate-wallet-form-resources';
import { FormHelper } from '@shared/forms/form-helper';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WalletInfo } from '@shared/models/wallet-info';

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
    private fb: FormBuilder,
    public walletService: WalletService,
    public activeModal: NgbActiveModal) {
    this.currentAccountService = currentAccountService;

    this.consolidateWalletForm = ConsolidateWalletComponentFormResources.buildConsolidateForm(fb);
  }

  public apiError: string;
  private currentWalletName: string;
  public consolidateWalletForm: FormGroup;
  public consolidateWalletFormErrors: any = {};
  public isConsolidating = false;

  ngOnInit(): void {
    this.currentWalletName = this.globalService.getWalletName();
  }

  public consolidateWallet(): void {
    const modal = this.modalService.open(ConfirmationModalComponent, {
      backdrop: 'static',
    });

    FormHelper.ValidateForm(this.consolidateWalletForm, this.consolidateWalletFormErrors, ConsolidateWalletComponentFormResources.consolidateWalletValidationMessages);

    if(this.consolidateWalletFormErrors.length > 0)
        return;

    const instance = modal.componentInstance;

    instance.title = 'Consolidate wallet';
    instance.body = `Are you sure you wish to consolidate all unspent UTXOs to address '${this.currentAccountService.address}'?.`;
    instance.confirmSnackBarMessage = `Consolidation to address ${this.currentAccountService.address} has started, please be patient.`;

    modal.result.then(confirmed => {

      if (confirmed) {

         if (this.currentAccountService.address != null) {

          this.isConsolidating = true;

          this.walletService.consolidateWallet(new WalletInfo(this.currentWalletName), this.consolidateWalletForm.get('password').value, this.currentAccountService.address)
          .then(_ => {
            // this.estimatedFee = transactionResponse.transactionFee;
            this.activeModal.close('Close clicked');
            // this.openConfirmationModal(transactionResponse);
            this.isConsolidating = false;
          }).catch(error => {
            this.isConsolidating = false;
            this.apiError = error.error.errors[0].message;
          });

      }}
    });
  }
}
