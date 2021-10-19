import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Observable, Subscription } from 'rxjs';
import { retryWhen, delay, tap } from 'rxjs/operators';
import { ElectronService } from '@shared/services/electron.service';
import { GlobalService } from '@shared/services/global.service';
import { NodeService } from '@shared/services/node-service';
import { FullNodeEventModel } from '@shared/services/interfaces/api.i';
import { ApiService } from '@shared/services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})

export class AppComponent implements OnInit, OnDestroy {
  constructor(private router: Router, private apiService: ApiService, private globalService: GlobalService, private titleService: Title, private electronService: ElectronService, private nodeService: NodeService) { }

  public fullNodeEvent: Observable<FullNodeEventModel>;
  public loading = true;
  public loadingFailed = false;
  public currentMessage: string;
  public currentState: string;
  private subscriptions: Subscription[] = [];

  private readonly MaxRetryCount = 30;
  private readonly TryDelayMilliseconds = 2000;
  public errorMessage: string;

  ngOnInit(): void {
    this.setTitle();
    this.fullNodeEvent = this.nodeService.FullNodeEvent();

    // Start the subscription.
    this.startFullNodeEventSubscription();

    // Ask the full node for its state, this is to check if the full node hasnt't completed initialization yet.
    // The node will reply with a signalR event, which if started will then navigate to the login page.
    this.checkFullNodeStatus();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private startFullNodeEventSubscription(): void {
    this.subscriptions.push(this.fullNodeEvent.subscribe(
      response => {
        if (response) {
          this.currentMessage = response.message;
          this.currentState = response.state;

          if (response.state === "Started") {
            this.loading = false;
            this.loadingFailed = false;
            this.router.navigate(['login']);
          }

          if (response.state === "Failed") {
            this.loading = false;
            this.loadingFailed = true;
          }
        }
      }
    ));
  }

  private checkFullNodeStatus() {
    console.log("Getting initial status from API.");

    let retry = 0;

    this.apiService.getNodeStatus(true, true).pipe(
      retryWhen(errors =>
        errors.pipe(delay(this.TryDelayMilliseconds)).pipe(
          tap(errorStatus => {
            if (retry++ === this.MaxRetryCount) {
              throw errorStatus;
            }
            console.log(`Retrying ${retry}...`);
          })
        )
      )
    );
  }

  private setTitle(): void {
    const applicationName = 'Cirrus Core';
    const testnetSuffix = this.globalService.getTestnetEnabled() ? ' (testnet)' : '';
    const title = `${applicationName} ${this.globalService.getApplicationVersion()}${testnetSuffix}`;

    this.titleService.setTitle(title);
  }

  public openSupport(): void {
    this.electronService.shell.openExternal('https://discord.gg/yb8SbycNQf');
  }
}