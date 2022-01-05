import BigNumber from 'bignumber.js';

export class Token {
  constructor(ticker: string, address: string, name: string, decimals: number, type: string) {
    this.ticker = ticker;
    this.address = address;
    this.name = name || this.ticker;
    this.decimals = decimals;
    this.type = type;
  }

  ticker: string;
  address: string;
  name: string;
  decimals: number;
  type: string;
}

export class SavedToken extends Token {
  private _balance: BigNumber;

  get balance(): string {
    return this._balance
      ? this._balance.toFixed(this.decimals)
      : '0.'.padEnd(this.decimals, '0');
  }

  constructor(ticker: string, address: string, balance: string, name: string, decimals: number, type: string) {
    super(ticker, address, name, decimals, type);
    this.setBalance(balance);
  }

  setBalance(balance: string) {
    this._balance = new BigNumber(balance).dividedBy(10**this.decimals);
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

    return new BigNumber(amount).multipliedBy(10**this.decimals);
  }
}
