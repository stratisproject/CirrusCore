import BigNumber from 'bignumber.js';

export class Token {
  constructor(ticker: string, address: string, name: string, decimals: number, type: string, interFluxEnabled: boolean, isDefault: boolean) {
    this.ticker = ticker;
    this.address = address;
    this.name = name || this.ticker;
    this.decimals = decimals;
    this.type = type;
    this.interFluxEnabled = interFluxEnabled;
    this.isDefault = isDefault;
  }

  ticker: string;
  address: string;
  name: string;
  decimals: number;
  type: string;
  interFluxEnabled: boolean;
  isDefault: boolean;
}

export class SavedToken extends Token {
  private _balance: BigNumber;

  get balance(): string {
    return this._balance
      ? this._balance.toFixed(this.decimals)
      : '0.'.padEnd(this.decimals, '0');
  }

  constructor(ticker: string, address: string, balance: string, name: string, decimals: number, type: string, interFluxEnabled: boolean, isDefault: boolean) {
    super(ticker, address, name, decimals, type, interFluxEnabled, isDefault);
    this.setBalance(balance);
  }

  setBalance(balance: string) {
    this._balance = new BigNumber(balance).dividedBy(10 ** this.decimals);
  }

  clearBalance() {
    this._balance = null;
  }

  hasBalance() {
    return this._balance !== null;
  }

  toScaledAmount(amount: number): BigNumber {
    if (this.decimals == null) {
      return new BigNumber(amount);
    }

    return new BigNumber(amount).multipliedBy(10 ** this.decimals);
  }
}