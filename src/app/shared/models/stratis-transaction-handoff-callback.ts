export interface IStratisTransactionHandoffCallback {
  transactionHash: string;
  walletAddress: string;
}

export class StratisTransactionHandoffCallback {
  private _transactionHash: string;
  private _walletAddress: string;

  public get payload(): IStratisTransactionHandoffCallback  {
    return {
      transactionHash: this._transactionHash,
      walletAddress: this._walletAddress
    }
  }

  constructor(transactionHash: string, walletAddress: string) {
    this._transactionHash = transactionHash;
    this._walletAddress = walletAddress;
  }
}
