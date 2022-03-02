import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Network } from '@shared/models/network';

export class SendComponentFormResources {

  public static sendValidationMessages = {
    'address': {
      'required': 'An address is required.',
      'minlength': 'An address is at least 26 characters long.'
    },
    'amount': {
      'required': 'An amount is required.',
      'pattern': 'Enter a valid transaction amount. Only positive numbers and no more than 8 decimals are allowed.',
      'min': 'The amount has to be more or equal to 0.00001.',
      'max': 'The total transaction amount exceeds your spendable balance.'
    },
    'fee': {
      'required': 'A fee is required.'
    },
    'password': {
      'required': 'Your password is required.'
    }
  };

  public static sendToSidechainValidationMessages = {
    'destinationAddress': {
      'required': 'An address is required.',
      'minlength': 'An address is at least 26 characters long.'
    },
    'federationAddress': {
      'required': 'An address is required.',
      'minlength': 'An address is at least 26 characters long.'
    },
    'amount': {
      'required': 'An amount is required.',
      'pattern': 'Enter a valid transaction amount. Only positive numbers and no more than 8 decimals are allowed.',
      'min': 'The amount has to be more or equal to 1.',
      'max': 'The total transaction amount exceeds your spendable balance.'
    },
    'fee': {
      'required': 'A fee is required.'
    },
    'password': {
      'required': 'Your password is required.'
    }
  };

  public static buildSendForm(fb: FormBuilder, balanceCalculator: () => number): FormGroup {
    return fb.group({
      // eslint-disable-next-line @typescript-eslint/unbound-method
      'address': ['', Validators.compose([Validators.required, Validators.minLength(26)])],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      'amount': ['', Validators.compose([Validators.required,
        Validators.pattern(/^([0-9]+)?(\.[0-9]{0,8})?$/),
        Validators.min(0.00001),
        (control: AbstractControl) => Validators.max(balanceCalculator())(control)])],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      'fee': ['medium', Validators.required],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      'password': ['', Validators.required]
    });
  }

  public static buildSendToSidechainForm(fb: FormBuilder, balanceCalculator: () => number): FormGroup {
    return fb.group({
      // eslint-disable-next-line @typescript-eslint/unbound-method
      federationAddress: ['', Validators.compose([Validators.required, Validators.minLength(26)])],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      networkSelect: ['', Validators.compose([Validators.required])],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      destinationAddress: ['', Validators.compose([Validators.required, Validators.minLength(26)])],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      amount: ['', Validators.compose([Validators.required,
        Validators.pattern(/^([0-9]+)?(\.[0-9]{0,8})?$/),
        Validators.min(1),
        (control: AbstractControl) => Validators.max(balanceCalculator())(control)])],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      fee: ['medium', Validators.required],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      password: ['', Validators.required]
    });
  }

  public static cirrusNetworks: Network[] = [
    { destinationName: 'Strax', federationAddress: 'cYTNBJDbgjRgcKARAvi2UCSsDdyHkjUqJ2', description: 'Strax Mainnet'}
  ];

  public static cirrusTestNetworks: Network[] = [
    { destinationName: 'Strax Test', federationAddress: 'xHtgXLa3CSjAVtmydqNrrMU7nZw7qdq2w6', description: 'Strax Testnet'}
  ];
}
