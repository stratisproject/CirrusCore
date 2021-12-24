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

@Injectable({
  providedIn: 'root'
})
export class TokensService {
  private savedTokens = 'savedTokens';
  private defaultTokens = [];

  constructor(private apiService: ApiService, private storage: StorageService, private globalService: GlobalService) {
    this.savedTokens = `${globalService.getNetwork()}:savedTokens`;

    // Upgrade wallets using the old format
    const oldTokens = this.storage.getItem<SavedToken[]>('savedTokens');
    if (oldTokens) {
      this.UpdateTokens(oldTokens);
      this.storage.removeItem('savedTokens');
    }
  }

  GetSavedTokens(): SavedToken[] {
    // Must map to the class here, just casting using getItem will not create the right object instance.
    const savedTokens = this.storage.getItem<SavedToken[]>(this.savedTokens);
    const result = savedTokens ? this.defaultTokens.concat(savedTokens) : this.defaultTokens;
    return result.map(t => new SavedToken(t.ticker, t.address, null, t.name, t.decimals, t.type));
  }

  GetAvailableTokens(): Token[] {
    const tokens = [];
    if (!this.globalService.getTestnetEnabled()) {
      tokens.push(new Token('MEDI', 'CUwkBGkXrQpMnZeWW2SpAv1Vu9zPvjWNFS', 'Mediconnect', 8, 'IStandardToken'));
    }
    return tokens;
  }

  UpdateTokens(tokens: SavedToken[]): Result<SavedToken[]> {
    this.storage.setItem(this.savedTokens, tokens);
    return Result.ok(tokens);
  }

  AddToken(token: SavedToken): Result<SavedToken> {
    if (!token) {
      return new Result(ResultStatus.Error, 'Invalid token');
    }
    const tokens = this.GetSavedTokens();

    const index = tokens.map(t => t.address).indexOf(token.address);
    if (index >= 0) {
      return new Result(ResultStatus.Error, 'Specified token is already saved');
    }

    tokens.push(token);
    this.storage.setItem(this.savedTokens, tokens);
    return Result.ok(token);
  }

  RemoveToken(token: SavedToken): Result<SavedToken> {
    if (!token) {
      return new Result(ResultStatus.Error, 'Invalid token');
    }
    const tokens = this.GetSavedTokens();
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
