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
  private savedTokens = 'savedTokens';
  private defaultTokens = [];

  constructor(
    private apiService: ApiService,
    private storage: StorageService,
    private globalService: GlobalService,
    private loggerService: LoggerService) {
    this.savedTokens = `${globalService.getNetwork()}:savedTokens`;

    // Upgrade wallets using the old format
    const oldTokens = this.storage.getItem<SavedToken[]>('savedTokens');
    if (oldTokens) {
      this.UpdateTokens(oldTokens);
      this.storage.removeItem('savedTokens');
    }
  }

  async GetSavedTokens(): Promise<SavedToken[]> {

    var supportedInterFluxTokens = [];

    // Retrieve the set of supported InterFlux tokens from the Api.
    var interFluxTokens = await this.apiService.supportedInterFluxTokens().toPromise();

    interFluxTokens.forEach((token) => {
      if (token.tokenName != 'USDC') {
        var interFluxToken = new Token(token.tokenName, token.src20Address, token.tokenName, token.decimals, TokenType.IStandardToken256.toString(), true);
        supportedInterFluxTokens.push(interFluxToken);
      }
    });

    const savedTokens = this.storage.getItem<SavedToken[]>(this.savedTokens);
    const result = savedTokens ? this.defaultTokens.concat(savedTokens) : this.defaultTokens;

    supportedInterFluxTokens.forEach((interFluxToken) => {
      var found = result.find(x => x.address === interFluxToken.address);
      if (found == null)
        result.push(interFluxToken);
    });

    return result.map(t => new SavedToken(t.ticker, t.address, null, t.name, t.decimals, t.type, t.interFluxEnabled));
  }

  GetAvailableTokens(): Token[] {
    const tokens = [];
    if (!this.globalService.getTestnetEnabled()) {
      tokens.push(new Token('MEDI', 'CUwkBGkXrQpMnZeWW2SpAv1Vu9zPvjWNFS', 'Mediconnect', 8, TokenType.IStandardToken, false));
    }
    return tokens;
  }

  UpdateTokens(tokens: SavedToken[]): Result<SavedToken[]> {
    this.storage.setItem(this.savedTokens, tokens);
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
    this.storage.setItem(this.savedTokens, tokens);
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
    this.storage.setItem(this.savedTokens, tokens);
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
