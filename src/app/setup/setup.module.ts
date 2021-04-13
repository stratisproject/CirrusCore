import { NgModule } from '@angular/core';
import { SetupComponent } from './setup.component';
import { CreateComponent } from './create/create.component';
import { SharedModule } from '@shared/shared.module';
import { SetupRoutingModule } from './setup-routing.module';
import { RecoverComponent } from './recover/recover.component';
import { ShowMnemonicComponent } from './create/show-mnemonic/show-mnemonic.component';
import { ConfirmMnemonicComponent } from './create/confirm-mnemonic/confirm-mnemonic.component';

@NgModule({
  imports: [
    SetupRoutingModule,
    SharedModule
  ],
  declarations: [
    CreateComponent,
    SetupComponent,
    RecoverComponent,
    ShowMnemonicComponent,
    ConfirmMnemonicComponent
  ]
})

export class SetupModule { }
