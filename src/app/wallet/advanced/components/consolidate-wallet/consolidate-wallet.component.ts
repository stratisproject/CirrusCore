import { Component, OnInit } from '@angular/core';
import { ConfirmationModalComponent } from '@shared/components/confirmation-modal/confirmation-modal.component';
import { GlobalService } from '@shared/services/global.service';
import { WalletService } from '@shared/services/wallet.service';
import { CurrentAccountService } from '@shared/services/current-account.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ConsolidateWalletComponentFormResources } from './consolidate-wallet-form-resources';
import { FormHelper } from '@shared/forms/form-helper';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConsolidateWalletModel } from '@shared/models/consolidate';

@Component({
  selector: 'app-consolidate-wallet',
  templateUrl: './consolidate-wallet.component.html',
  styleUrls: ['./consolidate-wallet.component.css']
})

export class ConsolidateWalletComponent implements OnInit {
  constructor(
    public currentAccountService: CurrentAccountService,
    private globalService: GlobalService,
    private modalService: NgbModal,
    fb: FormBuilder,
    public walletService: WalletService) {
    this.currentAccountService = currentAccountService;

    this.consolidateWalletForm = ConsolidateWalletComponentFormResources.buildConsolidateForm(fb);
  }

  public apiError: string;
  private currentWalletName: string;
  public consolidateWalletForm: FormGroup;
  public consolidateWalletFormErrors: any = {};
  public isConsolidating = false;
  public isConsolidatingComplete = false;
  public currentUtxoCount: string;

  ngOnInit(): void {
    this.currentWalletName = this.globalService.getWalletName();
    this.currentUtxoCount = "(retrieving)"
    this.walletService.walletHistory().subscribe(_ => { this.getUtxoCount(); });
    this.getUtxoCount();
  }

  private getUtxoCount(){
    this.walletService.getWalletStats()
      .subscribe(
        response => {
          this.currentUtxoCount = response;
        }
      );
  }

  public consolidateWallet(): void {

    this.apiError = '';
    
    FormHelper.ValidateForm(this.consolidateWalletForm, this.consolidateWalletFormErrors, ConsolidateWalletComponentFormResources.consolidateWalletValidationMessages);

    if(this.consolidateWalletFormErrors.length > 0)
        return;

    const modal = this.modalService.open(ConfirmationModalComponent, {
      backdrop: 'static',
    });

    const instance = modal.componentInstance;

    instance.title = 'Consolidate wallet';
    instance.body = `Are you sure you wish to consolidate all unspent UTXOs to address '${this.currentAccountService.address}'?.`;
    instance.confirmSnackBarMessage = `Consolidation to address ${this.currentAccountService.address} has started, please be patient.`;

    modal.result.then(confirmed => {

      if (confirmed) {

         if (this.currentAccountService.address != null) {

          this.isConsolidating = true;

          var model = new ConsolidateWalletModel(
            this.currentWalletName, 
            "account 0", 
            this.consolidateWalletForm.get('password').value,
            this.currentAccountService.address, 
            true);

          this.walletService.consolidateWallet(model)
          .then(_ => {
            this.consolidateWalletForm.reset();
            this.isConsolidating = false;
            this.isConsolidatingComplete = true;
          }).catch(error => {
            this.consolidateWalletForm.reset();
            this.isConsolidating = false;
            this.apiError = error.error.errors[0].message;
          });
      }}
    });
  }
}