import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormHelper } from '@shared/forms/form-helper';
import { WalletService } from '@shared/services/wallet.service';
import { AddNodeIPComponentFormResources } from './add-node-ip-form-resources';
import { NodeService } from '@shared/services/node-service';

@Component({
  selector: 'app-add-node-ip',
  templateUrl: './add-node-ip.component.html',
  styleUrls: ['./add-node-ip.component.css']
})

export class AddNodeIPComponent implements OnInit {
  constructor(
    private nodeService: NodeService,
    public walletService: WalletService,
    fb: FormBuilder) {
      
      this.addNodeIPForm = AddNodeIPComponentFormResources.buildAddNodeIPForm(fb);
  }

  public addNodeIPForm: FormGroup;
  public addNodeIPFormErrors: any = {};

  ipAddress: FormControl;
  ipAddressAdded = false;

  ngOnInit(): void {
    this.registerControls();
  }

  private registerControls() {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.ipAddress = new FormControl('', [Validators.required, Validators.pattern(/^([0-9]{1,3})[.]([0-9]{1,3})[.]([0-9]{1,3})[.]([0-9]{1,3})$/)]);

    this.addNodeIPForm = new FormGroup({
      ipAddress: this.ipAddress,
    });
  }

  public AddIPAddress(): void {

    FormHelper.ValidateForm(this.addNodeIPForm, this.addNodeIPFormErrors, AddNodeIPComponentFormResources.addNodeIPValidationMessages);

    if(this.addNodeIPFormErrors.length > 0)
      return;

      this.nodeService
      .addNode(this.addNodeIPForm.get('ipAddress').value)
      .toPromise().then(
        () => {
          this.ipAddressAdded = true;
          this.addNodeIPForm.patchValue({ipAddress: ''});
          this.addNodeIPFormErrors.ipAddress = '';
        }
      );
  }
}