import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';

export class ConsolidateWalletComponentFormResources {

  public static consolidateWalletValidationMessages = {
    'password': {
      'required': 'Your password is required.'
    }
  };

  public static buildConsolidateForm(fb: FormBuilder): FormGroup {
    return fb.group({
      // eslint-disable-next-line @typescript-eslint/unbound-method
      'password': ['', Validators.required]
    });
  }
}
