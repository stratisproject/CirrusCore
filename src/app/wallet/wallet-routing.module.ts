import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdvancedComponent } from './advanced/advanced.component';
import { AboutComponent } from './advanced/components/about/about.component';
import { ExtPubkeyComponent } from './advanced/components/ext-pubkey/ext-pubkey.component';
import { GenerateAddressesComponent } from './advanced/components/generate-addresses/generate-addresses.component';
import { ResyncComponent } from './advanced/components/resync/resync.component';
import { RemoveWalletComponent } from './advanced/components/remove-wallet/remove-wallet.component';
import { ConsolidateWalletComponent } from './advanced/components/consolidate-wallet/consolidate-wallet.component';
import { RewindNodeComponent } from './advanced/components/rewind/rewind-node.component';
import { AddNodeIPComponent } from './advanced/components/add-node-ip/add-node-ip.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HistoryComponent } from './history/history.component';
import { SmartContractsComponent } from './smart-contracts/components/smart-contracts.component';
import { TokensComponent } from './tokens/components/tokens.component';
import { WalletComponent } from './wallet.component';
import { AccountSelectedGuard } from '@shared/guards/account-selected.guard';
import { AuthenticationGuard } from '@shared/guards/auth.guard';

const routes: Routes = [
  {
    path: 'wallet', component: WalletComponent, canActivate: [AuthenticationGuard], children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, canActivate: [AuthenticationGuard] },
      { path: 'history', component: HistoryComponent, canActivate: [AuthenticationGuard] },
      {
        path: 'advanced', component: AdvancedComponent, canActivate: [AuthenticationGuard],
        children: [
          { path: '', redirectTo: 'about', pathMatch: 'full' },
          { path: 'about', component: AboutComponent, canActivate: [AuthenticationGuard] },
          { path: 'extpubkey', component: ExtPubkeyComponent, canActivate: [AuthenticationGuard] },
          { path: 'generate-addresses', component: GenerateAddressesComponent, canActivate: [AuthenticationGuard] },
          { path: 'resync', component: ResyncComponent, canActivate: [AuthenticationGuard] },
          { path: 'remove-wallet', component: RemoveWalletComponent, canActivate: [AuthenticationGuard] },
          { path: 'consolidate-wallet', component: ConsolidateWalletComponent, canActivate: [AuthenticationGuard] },
          { path: 'rewind-node', component: RewindNodeComponent, canActivate: [AuthenticationGuard] },
          { path: 'add-node-ip', component: AddNodeIPComponent, canActivate: [AuthenticationGuard] },
        ]
      },
      { path: 'smart-contracts', component: SmartContractsComponent, canActivate: [AccountSelectedGuard, AuthenticationGuard] },
      { path: 'tokens', component: TokensComponent, canActivate: [AccountSelectedGuard, AuthenticationGuard] },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class WalletRoutingModule { }
