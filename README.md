# Cirrus Core

This is the repository of the Cirrus Core Wallet, our sidechain wallet using Electron and Angular at the front-end and .NET Core with C# in the back-end.

# Building and running the StratisFullNode daemon

The StratisFullNode daemon is the backend REST service, hosting a Cirrus node upon which Cirrus Core depends.  
The StratisFullNode daemon is hosted in another repository. All information on building and running the daemon can be found [here](https://github.com/stratisproject/StratisFullNode/blob/master/Documentation/getting-started.md).

# Building and running the Cirrus Core user interface

## Install prerequisites
Download and install the latest version of Git [here](https://git-scm.com/).  
Download and install the latest Long Term Support (LTS) version of NodeJS [here](https://nodejs.org/). 

## Getting Started

Clone the repository locally:

``` bash
git clone https://www.github.com/stratisproject/CirrusCore
```

Navigate to the CirrusCore folder in a terminal:
``` bash
cd ./CirrusCore
```

## Install dependencies with npm:

From within the CirrusCoredirectory run:

``` bash
npm install
```

## Run the UI in development mode

#### Terminal Window 1
[Run the daemon](https://github.com/stratisproject/StratisFullNode/blob/master/Documentation/getting-started.md)  

#### Terminal Window 2
Use `npm run cirrusmain` to start the UI in CirrusMain mode or `npm run cirrustest` to start the UI in testnet mode.  
This will compile the Angular code and spawn the Electron process.

## Build the UI for production

|Command|Description|
|--|--|
|`npm run build:prod`| Compiles the application for production. Output files can be found in the dist folder |
|`npm run package:linux`| Builds your application and creates an app consumable on linux system |
|`npm run package:linuxarm`| Builds your application and creates an app consumable on linux-arm system (i.e., Raspberry Pi) |
|`npm run package:windows`| On a Windows OS, builds your application and creates an app consumable in windows 32/64 bit systems |
|`npm run package:mac`|  On a MAC OS, builds your application and generates a `.app` file of your application that can be run on Mac |

**The application is optimised. Only the files of /dist folder are included in the executable. Distributable packages can be found in the app-builds/ folder**
