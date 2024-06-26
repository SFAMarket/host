import {ethers, Contract} from "ethers";
import {PROVIDER_URL, TOKEN_CONTRACT_ADDRESS, MARKET_CONTRACT_ADDRESS, PRIVATE_KEY} from "../config/constants";
import SFAJson from "../assets/SFAToken.json";
import MarketJson from "../assets/Market.json";

export default async function initEthers(providerURL = PROVIDER_URL) {
    // Initialize provider
    const provider = new ethers.JsonRpcProvider(providerURL);

    // Initialize wallet
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Get ABIs
    const abiSFA = SFAJson.abi;
    const abiMarket = MarketJson.abi;

    // Initialize contract
    const tokenERC20 = new Contract(TOKEN_CONTRACT_ADDRESS, abiSFA, wallet);

    const marketERC721 = new Contract(MARKET_CONTRACT_ADDRESS, abiMarket, wallet);

    // Return structured object
    return {
        provider,
        wallet,
        contracts: {
            tokenERC20,
            marketERC721,
        },
    };
}
