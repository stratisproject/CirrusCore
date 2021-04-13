import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { AuthenticationService } from '@shared/services/auth.service';
import { WalletService } from '@shared/services/wallet.service';

@Component({
  selector: 'app-logout-confirmation',
  templateUrl: './logout-confirmation.component.html',
  styleUrls: ['./logout-confirmation.component.css']
})
export class LogoutConfirmationComponent implements OnInit {

  constructor(
    public activeModal: NgbActiveModal,
    private router: Router,
    private authenticationService: AuthenticationService,
    private walletService: WalletService) { }

  ngOnInit(): void {
  }

  public onLogout(): void {
    this.activeModal.close();
    this.authenticationService.SignOut();
    this.walletService.clearWalletHistory();
    this.router.navigate(['/login']);
  }
}
