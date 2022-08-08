import { TokenType } from '@shared/models/token-type';
import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalService } from '@shared/services/modal.service';
import { Observable, of, ReplaySubject } from 'rxjs';
import { take, switchMap, tap, map } from 'rxjs/operators';
import { Disposable } from '../../models/disposable';
import { LocalCallRequest } from '../../models/LocalCallRequest';
import { Mixin } from '../../models/mixin';
import { SavedToken } from '../../models/token';
import { TokensService } from '../../services/tokens.service';

@Component({
  selector: 'app-add-token',
  templateUrl: './add-token.component.html',
  styleUrls: ['./add-token.component.css']
})
@Mixin([Disposable])
export class AddTokenComponent implements OnDestroy, Disposable {
  addTokenForm: FormGroup;
  loading: boolean;
  apiError: string;
  validatedToken: any;
  disposed$ = new ReplaySubject<boolean>();
  dispose: () => void;

  get address(): FormControl {
    return this.addTokenForm.get('address') as FormControl;
  }

  get interFluxEnabled(): FormControl {
    return this.addTokenForm.get('interFluxEnabled') as FormControl;
  }

  constructor(
    private tokenService: TokensService,
    private activeModal: NgbActiveModal,
    private genericModalService: ModalService) {

    this.addTokenForm = new FormGroup({
      address: new FormControl('', [Validators.required]),
      interFluxEnabled: new FormControl(false)
    });
  }

  closeClicked(): void {
    this.activeModal.close();
  }

  resetToken(): void {
    this.address.setValue('');
    this.validatedToken = null;
  }

  async validateToken(): Promise<void> {
    const result = await this.tokenService.GetSavedTokens();
    var addedTokens = result.find(token => token.address === this.address.value);
    if (addedTokens) {
      this.showApiError(`This token is already added`);
      return;
    }

    this.loading = true;

    const token = { address: this.address.value, interFluxEnabled: this.interFluxEnabled.value } as any;
    const localCall = new LocalCallRequest(this.address.value, this.address.value, 'get_Symbol');

    // Using take(1) no need to unsubscribe explicitly
    this.tokenService.LocalCall(localCall)
      .pipe(
        tap(symbol => token.symbol = symbol.return),
        switchMap(_ => {
          localCall.methodName = 'get_Decimals';
          return this.tokenService.LocalCall(localCall).pipe(tap(decimals => token.decimals = decimals.return));
        }),
        switchMap(_ => {
          localCall.methodName = 'get_Name';
          return this.tokenService.LocalCall(localCall).pipe(tap(name => token.name = name.return));
        }),
        switchMap(_ => this.findTokenType$().pipe(tap(tokenType => token.type = tokenType))),
        take(1))
      .subscribe(_ => {
        // Old tokens such as MEDI, do not have a decimals property in contract, set 8
        if (!token.decimals && token.type === TokenType.IStandardToken) {
          token.decimals = 8;
        }

        token.valid = !!token.name && !!token.symbol && !!token.type && (token.decimals >= 0 && token.decimals <= 18);

        this.validatedToken = token;
        this.loading = false;
      });
  }

  async onSubmit(): Promise<void> {
    if (this.validatedToken?.valid !== true) {
      this.showApiError('Invalid Token');
      return;
    }

    const savedToken = new SavedToken(this.validatedToken.symbol,
      this.validatedToken.address,
      '0',
      this.validatedToken.name,
      this.validatedToken.decimals,
      this.validatedToken.type,
      this.validatedToken.interFluxEnabled,
      false);

    const result = await this.tokenService.AddToken(savedToken);

    if (result.failure) {
      this.apiError = result.message;
      return;
    }

    this.activeModal.close(savedToken);
  }

  showApiError(error: string): void {
    this.genericModalService.openModal('Error', error);
  }

  /**
   * @summary Attempts a local-call TransferTo with 0 tokens only to verify the token is of an IStandardToken or IStandardToken256 type
   * @returns null or supported interface
   */
  private findTokenType$(): Observable<string> {
    const request = new LocalCallRequest(this.address.value, this.address.value, 'TransferTo', 0);

    // Try UInt256 first
    request.parameters = [`9#${this.address.value}`, '12#0'];

    return this.tokenService.LocalCall(request)
      .pipe(
        map(response => response.return === true && !response.errorMessage ? TokenType.IStandardToken256 : ''),
        switchMap((type: string) => {
          if (type === TokenType.IStandardToken256) return of(type);

          request.parameters = [`9#${this.address.value}`, '7#0'];

          return this.tokenService.LocalCall(request)
            .pipe(map(response => response.return === true && !response.errorMessage ? TokenType.IStandardToken : ''));
        }));
  }

  ngOnDestroy(): void {
    this.dispose();
  }
}
