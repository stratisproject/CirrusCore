import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { AdvancedComponent } from './advanced/advanced.component';
import { AboutComponent } from './advanced/components/about/about.component';
import { ExtPubkeyComponent } from './advanced/components/ext-pubkey/ext-pubkey.component';
import { GenerateAddressesComponent } from './advanced/components/generate-addresses/generate-addresses.component';
import { ResyncComponent } from './advanced/components/resync/resync.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HistoryComponent } from './history/history.component';
import { LogoutConfirmationComponent } from './logout-confirmation/logout-confirmation.component';
import { MenuComponent } from './menu/menu.component';
import { ReceiveComponent } from './receive/receive.component';
import { SendConfirmationComponent } from './send/send-confirmation/send-confirmation.component';
import { SendComponent } from './send/send.component';
import { SmartContractsModule } from './smart-contracts/smart-contracts.module';
import { StatusBarComponent } from './status-bar/status-bar.component';
import { TokensModule } from './tokens/tokens.module';
import { TransactionDetailsComponent } from './transaction-details/transaction-details.component';
import { WalletRoutingModule } from './wallet-routing.module';
import { WalletComponent } from './wallet.component';
import { AccountSelectedGuard } from '@shared/guards/account-selected.guard';
import { TransactionsComponent } from './transactions/transactions.component';
import { RemoveWalletComponent } from './advanced/components/remove-wallet/remove-wallet.component';
import { ConsolidateWalletComponent } from './advanced/components/consolidate-wallet/consolidate-wallet.component';
import { RewindNodeComponent } from './advanced/components/rewind/rewind-node.component';
import { AddNodeIPComponent } from './advanced/components/add-node-ip/add-node-ip.component';

@NgModule({
  imports: [
    SharedModule,
    WalletRoutingModule,
    SmartContractsModule.forRoot(),
    TokensModule,
    TabsModule.forRoot(),
  ],
  declarations: [
    WalletComponent,
    MenuComponent,
    DashboardComponent,
    SendComponent,
    ReceiveComponent,
    SendConfirmationComponent,
    TransactionDetailsComponent,
    LogoutConfirmationComponent,
    HistoryComponent,
    StatusBarComponent,
    AdvancedComponent,
    ExtPubkeyComponent,
    AboutComponent,
    GenerateAddressesComponent,
    ResyncComponent,
    TransactionsComponent,
    RemoveWalletComponent,
    ConsolidateWalletComponent,
    RewindNodeComponent,
    AddNodeIPComponent
  ],
  providers: [
    AccountSelectedGuard
  ]
})

export class WalletModule { }