export const PRIVATE_KEY =
    process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
export const PROVIDER_URL = process.env.PROVIDER_URL || "http://127.0.0.1:8545";
export const TOKEN_CONTRACT_ADDRESS =
    process.env.TOKEN_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
export const MARKET_CONTRACT_ADDRESS =
    process.env.MARKET_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

// Auto Host Preferences
export const AUTO_HOST = process.env.AUTO_HOST === "true" || false;
export const BYTE_PER_VESTING = Number(process.env.BYTE_PER_VESTING) || 3170000000;
export const MAX_CID_SIZE = process.env.MAX_CID_SIZE || "500 MB";
export const MAX_DISK_USE = process.env.MAX_DISK_USE || "10 GB";
export const MIN_COLLATERAL_RATIO_BPS = Number(process.env.MIN_COLLATERAL_RATIO_BPS) || 0;
export const MAX_COLLATERAL_RAITO_BPS = Number(process.env.MAX_COLLATERAL_RAITO_BPS) || 10e3;
