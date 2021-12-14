import { IStratisSignatureAuthCallback } from '@shared/models/stratis-signature-auth-callback';
import { IStratisTransactionHandoffCallback } from '@shared/models/stratis-transaction-handoff-callback';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { getHttpOptions } from './rest-api';

@Injectable({
  providedIn: 'root'
})
export class IntegrationsService {
  constructor(private httpClient: HttpClient) { }

  public stratisTransactionHandoffCallback(endpoint: string, callbackData: IStratisTransactionHandoffCallback): Observable<void> {
    return this.executeHttp('post', endpoint, callbackData, 'application/json');
  }

  public stratisSignatureAuthCallback(endpoint: string, callbackData: IStratisSignatureAuthCallback): Observable<void> {
    return this.executeHttp('post', endpoint, callbackData, 'application/json');
  }

  private executeHttp<TResult>(method: string, endpoint: string, body: any, contentType?: string, params?: HttpParams): Observable<TResult> {
    return this.httpClient[method](endpoint, body, getHttpOptions('application/json', contentType || 'application/json', params)) as Observable<TResult>;
  }
}
