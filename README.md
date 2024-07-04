# SFA Host

SFA Host is a agregated service that works with IPFS.
to use Host you first have to install and run your IPFS deamon Locally.

# Usage

recommend to use pnpm

```sh
pnpm install
pnpm start
```

## Automation

you cna set your Host work automatically taking position everytime that a new SFA with preference condition are taken.

see `preferences.json` file

```json
{
  "automate": false,
  "bytesPerVestingSeconds": {
    "ETH": 3170000000,
    "USDC": 0.0317
  },
  "maxCIDSize": 1000,
  "maxDiskUse": 10e6,
  "collateralRatioRange": [0, 1]
}
```
