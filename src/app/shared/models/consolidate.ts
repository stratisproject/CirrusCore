export class ConsolidateWalletModel {
  constructor(
    public walletName: string,
    public accountName: string,
    public walletPassword: string,
    public destinationAddress: string,
    public broadcast: boolean) {
  }
}