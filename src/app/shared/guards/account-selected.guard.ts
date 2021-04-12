import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate, Router } from '@angular/router';
import { CurrentAccountService } from '@shared/services/current-account.service';
import { GlobalService } from '@shared/services/global.service';

@Injectable({
  providedIn: 'root'
})
export class AccountSelectedGuard implements CanActivate {
  constructor(
    private router: Router,
    private globalService: GlobalService,
    private currentAccountService: CurrentAccountService) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const accountsEnabled = this.currentAccountService.hasActiveAddress();

    if (!accountsEnabled) {
      this.router.navigate(['/address-selection'])
      return false;
    }

    return true;
  }
}
