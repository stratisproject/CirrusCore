import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';

export class AddNodeIPComponentFormResources {

  public static addNodeIPValidationMessages = {
    'ipAddress': {
      'required': 'The IP address is required.'
    }
  };

  public static buildAddNodeIPForm(fb: FormBuilder): FormGroup {
    return fb.group({
      // eslint-disable-next-line @typescript-eslint/unbound-method
      'ipAddress': ['', Validators.required]
    });
  }
}
