export interface IStratisSignatureAuthCallback {
  signature: string;
  publicKey: string;
}

export class StratisSignatureAuthCallback {
  private _signature: string;
  private _publicKey: string;

  public get payload(): IStratisSignatureAuthCallback  {
    return {
      signature: this._signature,
      publicKey: this._publicKey
    }
  }

  constructor(signature: string, publicKey: string) {
    this._signature = signature;
    this._publicKey = publicKey;
  }
}
