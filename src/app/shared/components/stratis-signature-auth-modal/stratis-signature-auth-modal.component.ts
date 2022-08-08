import { StratisSignatureAuthCallback } from './../../models/stratis-signature-auth-callback';
import { CurrentAccountService } from '@shared/services/current-account.service';
import { take, switchMap, catchError, filter } from 'rxjs/operators';
import { IntegrationsService } from '@shared/services/integrations.service';
import { of, Subscription } from 'rxjs';
import { Component, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '@shared/services/api.service';
import { GlobalService } from '@shared/services/global.service';
import { LoggerService } from '@shared/services/logger.service';

@Component({
  selector: 'app-stratis-signature-auth-modal',
  templateUrl: './stratis-signature-auth-modal.component.html',
  styleUrls: ['./stratis-signature-auth-modal.component.scss']
})
export class StratisSignatureAuthModalComponent implements OnDestroy {
  form: FormGroup;
  subscription = new Subscription();
  request: any;
  submitting = false;

  public get message() {
    return this.form.get('message');
  }

  public get password() {
    return this.form.get('password');
  }

  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private integrationsService: IntegrationsService,
    private apiService: ApiService,
    private globalService: GlobalService,
    private currentAccountService: CurrentAccountService
  ) {
    this.form = this.formBuilder.group({
      message: ['', [Validators.required]],
      password: ['', Validators.required]
    });

    this.subscription.add(this.message.valueChanges.subscribe(message => this.setRequest(message)));
  }

  private setRequest(message: string): void {
    if (message === null || message === undefined || message === '') {
      this.request = null;
      return;
    }

    if (!message.startsWith('sid:')) {
      this.request = { error: 'Message SID is invalid.' };
      return;
    }

    this.request = { message: message.replace('sid:', '') };

    try {
      const url = new URL(`https://${this.request.message}`);

      this.request.callback = url.href;
      this.request.origin = url.origin;
      this.request.uid = url.searchParams.get('uid');
      this.request.expUnix = url.searchParams.get('exp');
    } catch {
      this.request.error = 'Message URL is invalid.';
      return;
    }

    if (!this.request.uid) {
      this.request.error = 'Message UID is invalid.';
      return;
    }

    if (this.request.expUnix) {
      this.request.expTime = new Date(parseInt(this.request.expUnix) * 1000).getTime();
      const now = new Date().getTime();

      if (this.request.expTime < now) {
        this.request.error = 'Message is expired.';
        return;
      }
    }
  }

  submit(): void {
    const walletName = this.globalService.getWalletName();
    const externalAddress = this.currentAccountService.address;

    const signPayload = {
      walletName,
      externalAddress,
      password: this.password.value,
      message: this.request.message
    }

    this.submitting = true;

    this.subscription.add(
      // Sign Message
      this.apiService.signMessage(signPayload)
        .pipe(
          catchError(a => {
            var errorMessage = a.error ? a.error.errors ? a.error.errors[0] ? ": " + a.error.errors[0].message : "" : "" : "";
            this.request.error = "Error signing message" + errorMessage;
            this.submitting = false;
            return of();
          }),
          filter(signature => !!signature),
          switchMap((signature: string) => {
            // Submit callback to origin
            const request = new StratisSignatureAuthCallback(signature, externalAddress);
            return this.integrationsService.stratisSignatureAuthCallback(this.request.callback, request.payload);
          }),
          take(1))
        .subscribe(_ => {
          this.submitting = false;
          this.activeModal.close();
        }))
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
