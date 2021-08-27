import { GeneralInfo } from '@shared/services/interfaces/api.i';

export interface SignalREvent {
  nodeEventType: string;
}

export interface BlockConnectedSignalREvent extends SignalREvent {
  hash: string;
  height: number;
}

export interface WalletInfoSignalREvent extends SignalREvent, GeneralInfo {
}

export interface FullNodeEvent extends SignalREvent {
  message: string;
  state: string;
}

export interface WalletProcessedTransactionOfInterestEvent extends SignalREvent {
  source: string;
}

export enum SignalREvents {
  BlockConnected = 'BlockConnected',
  WalletGeneralInfo = 'WalletGeneralInfo',
  FullNodeEvent = 'FullNodeEvent',
  WalletProcessedTransactionOfInterestEvent = 'WalletProcessedTransactionOfInterestEvent'
}
