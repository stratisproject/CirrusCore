import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormHelper } from '@shared/forms/form-helper';
import { ApiService } from '@shared/services/api.service';
import { WalletService } from '@shared/services/wallet.service';
import { RewindNodeComponentFormResources } from './rewind-node-form-resources';

@Component({
  selector: 'app-rewind-node',
  templateUrl: './rewind-node.component.html',
  styleUrls: ['./rewind-node.component.css']
})

export class RewindNodeComponent implements OnInit {
  constructor(
    private apiService: ApiService, 
    public walletService: WalletService,
    fb: FormBuilder) {
      
      this.rewindHeightForm = RewindNodeComponentFormResources.buildRewindNodeForm(fb);
  }

  public rewindHeightForm: FormGroup;
  public rewindHeightFormErrors: any = {};

  rewindHeight: FormControl;
  rewindSet = false;

  ngOnInit(): void {
    this.registerControls();
  }

  private registerControls() {
    const integerValidator = Validators.pattern('^[0-9][0-9]*$');

    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.rewindHeight = new FormControl(0, [Validators.required, Validators.min(1), integerValidator]);

    this.rewindHeightForm = new FormGroup({
      rewindHeight: this.rewindHeight,
    });
  }

  public RewindNode(): void {

    FormHelper.ValidateForm(this.rewindHeightForm, this.rewindHeightFormErrors, RewindNodeComponentFormResources.rewindNodeValidationMessages);

    if(this.rewindHeightFormErrors.length > 0)
      return;

    this.apiService.rewindNode(this.rewindHeightForm.get('rewindHeight').value)
      .subscribe(
        response => {
          this.rewindSet = true;
        }
      );
  }
}