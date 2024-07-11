import {JsonRpcProvider, Wallet, Contract} from "ethers";
import {HeliaLibp2p} from "helia";
import {Libp2p} from "libp2p";
import {UnixFS} from "@helia/unixfs";

export interface IpfsStruct {
    node: HeliaLibp2p<Libp2p>;
    fs: UnixFS;
}

export interface EthersStruct {
    provider: JsonRpcProvider;
    wallet: Wallet;
    contracts: {
        tokenERC20: Contract;
        marketERC721: Contract;
    };
}

export interface Host {
    status: string;
    multiAddrs: string;
}

export interface SFA {
    publisher: string;
    cid: string;
    vesting: string;
    vested: string;
    startTime: string;
    ttl: string;
    status: string;
    host: string;
    pendingHost: string;
    collateral: string;
}
