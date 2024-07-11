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

you can setup auto Host! work automatically taking position everytime that a new SFA with preference condition are taken.

see `# Preferences` in `.env`file

```bash
# Preferences
AUTO_HOST=false
BYTES_PER_VESTING=3170000000
MAX_CID_SIZE="500 MB"
MAX_DISK_USE="10 GB"
MIN_COLLATERAL_RATIO_BPS=0
MAX_COLLATERAL_RAITO_BPS=10e3
```
