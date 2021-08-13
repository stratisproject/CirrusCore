import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ClipboardModule } from 'ngx-clipboard';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SmartContractsServiceBase, SmartContractsService } from '@shared/services/smart-contracts.service';
import { SmartContractsComponent } from './components/smart-contracts.component';
import { TransactionComponent } from './components/modals/transaction/transaction.component';
import { SharedModule } from '@shared/shared.module';
import { ScBalanceComponent } from './components/balance/balance.component';
import { ContractTypePipe } from './components/contract-type.pipe';
import { AddressSelectionComponent } from './components/address-selection/address-selection.component';

@NgModule({
  imports: [
    CommonModule, NgbModalModule, ClipboardModule, FormsModule, ReactiveFormsModule, SharedModule
  ],

  providers: [{ provide: SmartContractsServiceBase, useClass: SmartContractsService }],
  exports: [
    ScBalanceComponent
  ],
  declarations: [
    SmartContractsComponent,
    TransactionComponent,
    ScBalanceComponent,
    ContractTypePipe,
    AddressSelectionComponent
  ]
})
export class SmartContractsModule {
  static forRoot(): ModuleWithProviders<SmartContractsModule> {
    return {
      ngModule: SmartContractsModule,
      providers: [
        { provide: SmartContractsServiceBase, useClass: SmartContractsService }
      ]
    };
  }
}
