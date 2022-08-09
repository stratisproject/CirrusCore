import { TokenType } from '@shared/models/token-type';
import { Injectable } from '@angular/core';
import { LocalExecutionResult } from '@shared/models/local-execution-result';
import { ApiService } from '@shared/services/api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LocalCallRequest } from '../models/LocalCallRequest';
import { Result, ResultStatus } from '../models/result';
import { SavedToken, Token } from '../models/token';
import { TokenBalanceRequest } from '../models/token-balance-request';
import { StorageService } from './storage.service';
import { GlobalService } from '@shared/services/global.service';
import { LoggerService } from '@shared/services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class TokensService {
  private savedTokensKey = 'savedTokens';

  private opDexTestNetContractAddress = "tTTuKbCR2UnsEByXBp1ynBz91J2yz63h1c";
  private opDexMainNetContractAddress = "CUAQPZkWat7ECSFoGCMPfdnF5rZbSF92zL";

  constructor(
    private apiService: ApiService,
    private storage: StorageService,
    private globalService: GlobalService,
    private loggerService: LoggerService) {
    this.savedTokensKey = `${globalService.getNetwork()}:savedTokens`;
  }

  async GetSavedTokens(): Promise<SavedToken[]> {

    // If there are no saved tokens, set the tokens to the default token list.
    var tokens = this.storage.getItem<SavedToken[]>(this.savedTokensKey);
    if (tokens == null)
      tokens = this.GetDefaultTokens();
    else {
      // if there are saved tokens add the default tokens to the saved token list, if they dont exist already.
      this.GetDefaultTokens().forEach((defaultToken) => {
        var found = tokens.find(x => x.address == defaultToken.address);
        if (found == null)
          tokens.push(defaultToken);
      });
    }

    var supportedInterFluxTokens = [];

    // Retrieve the set of supported InterFlux tokens from the Api.
    var interFluxTokens = await this.apiService.supportedInterFluxTokens().toPromise();

    interFluxTokens.forEach((token) => {
      var interFluxToken = new Token(token.tokenName, token.src20Address, token.tokenName, token.decimals, TokenType.IStandardToken256.toString(), true, false);
      supportedInterFluxTokens.push(interFluxToken);
    });

    supportedInterFluxTokens.forEach((interFluxToken) => {
      var found = tokens.find(x => x.address == interFluxToken.address);
      if (found == null)
        tokens.push(interFluxToken);
    });

    return tokens.map(t => new SavedToken(t.ticker, t.address, null, t.name, t.decimals, t.type, t.interFluxEnabled, t.isDefault));
  }

  GetDefaultTokens(): SavedToken[] {
    const tokens = [];
    if (this.globalService.getTestnetEnabled()) {
      tokens.push(new SavedToken('ODX', this.opDexTestNetContractAddress, null, 'OPDEX', 8, TokenType.IStandardToken256, false, true));
    }
    else
      tokens.push(new SavedToken('ODX', this.opDexMainNetContractAddress, null, 'OPDEX', 8, TokenType.IStandardToken256, false, true));

    return tokens;
  }

  UpdateTokens(tokens: SavedToken[]): Result<SavedToken[]> {
    this.storage.setItem(this.savedTokensKey, tokens);
    return Result.ok(tokens);
  }

  async AddToken(token: SavedToken): Promise<Result<SavedToken>> {
    if (!token) {
      return new Result(ResultStatus.Error, 'Invalid token');
    }

    const tokens = await this.GetSavedTokens();

    const index = tokens.map(t => t.address).indexOf(token.address);
    if (index >= 0) {
      return new Result(ResultStatus.Error, 'Specified token is already saved');
    }

    tokens.push(token);
    this.loggerService.info(tokens.length);
    this.storage.setItem(this.savedTokensKey, tokens);

    return Result.ok(token);
  }

  async RemoveToken(token: SavedToken): Promise<Result<SavedToken>> {
    if (!token) {
      return new Result(ResultStatus.Error, 'Invalid token');
    }

    const tokens = await this.GetSavedTokens();
    const index = tokens.map(t => t.address).indexOf(token.address);
    if (index < 0) {
      return new Result(ResultStatus.Error, 'Specified token was not found');
    }

    tokens.splice(index, 1);
    this.storage.setItem(this.savedTokensKey, tokens);
    return Result.ok(token);
  }

  GetTokenBalance(request: TokenBalanceRequest): Observable<BigInt> {
    return this.LocalCall(request)
      .pipe(
        map((response: LocalExecutionResult) => {
          const digitsOnlyRegex = new RegExp(/^\d+$/);
          if (!response.return || !digitsOnlyRegex.test(response.return.toString())) {
            return BigInt(0);
          }

          return BigInt(response.return);
        })
      );
  }

  LocalCall(request: LocalCallRequest): Observable<LocalExecutionResult> {
    return this.apiService.localCall(request);
  }
}
