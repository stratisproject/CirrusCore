export class StratisTransactionHandoff {
  private _callback: string;
  private _amount: number;
  private _contractAddress: string;
  private _methodName: string;
  private _parameters: string[];
  private _errors: string[];

  public get callback(): string {
    return this._callback;
  }

  public get amount(): number {
    return this._amount;
  }

  public get contractAddress(): string {
    return this._contractAddress;
  }

  public get methodName(): string {
    return this._methodName;
  }

  public get parameters(): string[] {
    return this._parameters;
  }

  public get errors(): string[] {
    return this._errors;
  }

  constructor(value: any) {
    this._errors = [];
    this._parameters = [];

    try {
      const handoff = JSON.parse(value);
      const to = handoff?.to;
      if (!to) this._errors.push('Invalid contract address.');

      const methodName = handoff?.method;
      if (!methodName) this._errors.push('Invalid method name.');

      const parameters = handoff?.parameters || [];

      this._contractAddress = to;
      this._methodName = methodName;
      // Don't care if this is missing
      this._callback = handoff?.callback;
      // This can be 0, as long as it parses we're good.
      this._amount = parseFloat(handoff?.amount);
      this._parameters = parameters.map(param => param.value);
    } catch {
      this._errors.push('Unexpected error.');
    }
  }
}
