import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from '@shared/shared.module';
import { ClipboardModule } from 'ngx-clipboard';
import { SmartContractsModule } from '../smart-contracts/smart-contracts.module';
import { AddTokenComponent } from './components/add-token/add-token.component';
import { ProgressComponent } from './components/progress/progress.component';
import { SendTokenComponent } from './components/send-token/send-token.component';
import { TokensComponent } from './components/tokens.component';
import { StorageService } from './services/storage.service';
import { TokensService } from './services/tokens.service';
import { SmartContractsService } from '@shared/services/smart-contracts.service';

@NgModule({
  imports: [
    CommonModule, NgbModalModule, ClipboardModule, FormsModule, ReactiveFormsModule, SharedModule, SmartContractsModule.forRoot()
  ],

  providers: [TokensService, StorageService, SmartContractsService],

  declarations: [
    TokensComponent,
    AddTokenComponent,
    SendTokenComponent,
    ProgressComponent
  ]
})
export class TokensModule { }
