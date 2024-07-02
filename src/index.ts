/* eslint-disable no-console */
import chalk from "chalk";
import {CID} from "multiformats/cid";
import {multiaddr, isMultiaddr} from "@multiformats/multiaddr";
import {peerIdFromString} from "@libp2p/peer-id";
import {PeerId} from "@libp2p/interface";
import initEthers from "./modules/ethers.ts";
import initHelia from "./modules/helia.ts";
import {JsonRpcProvider, Wallet, Contract, formatUnits, formatEther, parseUnits, parseEther, ethers} from "ethers";
import inquirer from "inquirer";
import {DateTime} from "luxon";
import * as utils from "./modules/utils.ts";
import * as CONSTANTS from "./config/constants.ts";

interface EthersStruct {
    provider: JsonRpcProvider;
    wallet: Wallet;
    contracts: {
        tokenERC20: Contract;
        marketERC721: Contract;
    };
}

// interface ipfsStruct {
//     node: HeliaLibp2p;
//     fs: UnixFS;
// }

interface Host {
    status: string;
    multiAddrs: string;
}

interface SFA {
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

let eth: EthersStruct;
let ipfs: any;
let dialedPeers: PeerId[] = [];
let storageOrders: CID[] = [];
let SFAs: SFA[] = [];

/**
 * Actions
 */

const getStorageOrders = async () => {
    const sfaAddress = await eth.contracts.tokenERC20.getAddress();
    console.log("Greeting from contract SFA:", sfaAddress);
    const marketAddress = await eth.contracts.marketERC721.getAddress();
    console.log("Greeting from contract Market:", marketAddress);
};

const printLocalPeerData = async () => {
    console.info("PeerId:", ipfs.node?.libp2p.peerId.toString());
    console.info("MultiAddress of this Node:");
    const addr = ipfs.node?.libp2p.getMultiaddrs();
    console.log(addr);
};

const printDialedPeers = async () => {
    dialedPeers = ipfs.node?.libp2p.getPeers();
    console.log("The following peers are dialing:");
    console.log(dialedPeers);
};

const dialAPeerID = async (peer: string) => {
    try {
        console.log("Dialing {peer}...");
        const dialPeerID = peerIdFromString(peer);
        await ipfs.node?.libp2p.dial(dialPeerID);
        console.log("OK: dialed:", dialPeerID);
    } catch (error) {
        console.log("Error: ", error);
    }
};

const dialAMultiaddr = async (addrs: string) => {
    const peerMultiAddr = multiaddr(addrs);
    try {
        if (isMultiaddr(peerMultiAddr)) {
            await ipfs.node?.libp2p.dial(peerMultiAddr);
            console.log("dialed:", peerMultiAddr);
        }
    } catch (error) {
        console.log("Error: ", error);
    }
};

const printNumerableDialedPeers = () => {
    dialedPeers = ipfs.node?.libp2p.getPeers();
    for (let [index, element] of dialedPeers.entries()) {
        console.log(`${index} is peerID: ${element.toString()}`);
    }
};

const hangUpAPeer = async (index: string) => {
    let hangUpPeerId = dialedPeers[Number(index)];
    try {
        await ipfs.node?.libp2p.hangUp(hangUpPeerId);
        console.log(`peerID: ${hangUpPeerId.toString()},\n hanged Up`);
    } catch (error) {
        console.log("Error: ", error);
    }
};

const printNumerableOrders = async () => {
    try {
        if (storageOrders.length > 0) {
            for (let [index, element] of storageOrders.entries()) {
                console.log(`${index} order has CID: ${element.toString()}`);
            }
        } else {
            console.log("No Stored Orders");
        }
    } catch (error) {
        console.log("Error:", error);
    }
};

const pushData = async (data: string) => {
    const encoder = new TextEncoder();
    const cid = await ipfs.fs.addBytes(encoder.encode(data), {
        onProgress: (evt: any) => {
            console.info("add event", evt.type, evt.detail);
        },
    });
    storageOrders.push(cid);
    console.log("Added file:", cid.toString());
    return cid.toString();
};

const getData = async (orderIdx: string) => {
    const decoder = new TextDecoder();
    const selectedOrder = storageOrders[Number(orderIdx)];
    let text = "";

    for await (const chunk of ipfs.fs.cat(selectedOrder, {
        onProgress: (evt: any) => {
            console.info("cat event", evt.type, evt.detail);
        },
    })) {
        text += decoder.decode(chunk, {
            stream: true,
        });
    }

    console.log(`Data from: ${selectedOrder.toString()}`);
    console.log(text);
};

const pinCID = async (cidString: string) => {
    const cid2Pin = CID.parse(cidString);
    try {
        ipfs.node?.pins.add(cid2Pin);
        storageOrders.push(cid2Pin);
        console.log("pinned CID:", cidString);
    } catch (error) {
        console.log("Pinning CID Error:", error);
    }
};

const unPinCID = async (index: number) => {
    const idxNum = +index;
    let cid2Unpin = storageOrders[index];
    try {
        ipfs.node?.pins.rm(cid2Unpin);
        if (idxNum > -1 && idxNum < storageOrders.length) {
            storageOrders.splice(idxNum, 1);
            console.log(`Unpinned CID: ${cid2Unpin.toString()}`);
        }
    } catch (error) {
        console.log("Error: ", error);
    }
};

const turnOff = async () => {
    console.log("Closing helias");
    await ipfs.node?.stop();
    console.log("✅ Done");
    console.log("👋 See ya");
};

const balanceERC20 = async (address?: string) => {
    const walletAddress = address || (await eth.wallet.getAddress());
    const decimals = await eth.contracts.tokenERC20.decimals();
    const sfaBalance = await eth.contracts.tokenERC20.balanceOf(walletAddress);
    console.log("SFA Balance:", formatUnits(sfaBalance.toString(), decimals));
    const ethBalance = await eth.provider.getBalance(walletAddress);
    console.log("ETH Balance:", formatEther(ethBalance));
};

const importPKey = async (pKey: string) => {
    try {
        eth = await initEthers(pKey);
        console.log("new EOAccount is:", eth.wallet.getAddress());
    } catch (error) {
        console.log("Error on importPKey:", error);
    }
};

const registerHost = async (multiAddrs: string) => {
    try {
        const tx = await eth.contracts.marketERC721.registerHost(multiAddrs);
        const receipt = await tx.wait();
        console.log(`The host was registered (${receipt.transactionHash})`);
        await dialAMultiaddr(multiAddrs);
    } catch (error) {
        console.log("Error at Host Registry:", error);
    }
};

const fetchHost = async (addrs: string) => {
    try {
        const result = await eth.contracts.marketERC721.hosts(addrs);
        const host = {
            status: result[0],
            multiAddrs: result[1],
        };
        console.log("Host Status:", host.status);
        console.log("Host Multiaddress:", host.multiAddrs);
        if (host) {
            await dialAMultiaddr(host.multiAddrs);
        }
    } catch (error) {
        console.log("Error at fetching a host:", error);
    }
};

const transferTokens = async (to: string, amount: string) => {
    const decimals = await eth.contracts.tokenERC20.decimals();
    const tokenAmount = parseUnits(amount, decimals);
    try {
        const tx = await eth.contracts.tokenERC20.transfer(to, tokenAmount);
        const receipt = await tx.wait();
        console.log(`The ${tokenAmount} tokens were sent to ${to}\n  on TxID: (${receipt})`);
    } catch (error) {
        console.log("Error transferring tokens:", error);
    }
};

const allowTokens = async (to: string, amount: number) => {
    const decimals = await eth.contracts.tokenERC20.decimals();
    const tokenAmount = BigInt(amount * 10 ** decimals);
    try {
        const tx = await eth.contracts.tokenERC20.approve(to, tokenAmount.toString());
        const receipt = await tx.wait();
        console.log(`The ${tokenAmount} Tokens were approved to ${to}\n  on TxID: (${receipt})`);
    } catch (error) {
        console.log("Error transferring tokens:", error);
    }
};

const createSFA = async (vesting: number, cid: string, startTime: number, ttl: number) => {
    try {
        const walletAddress = eth.wallet.address;
        const marketAddress = await eth.contracts.marketERC721.getAddress();
        const allowance = await eth.contracts.tokenERC20.allowance(walletAddress, marketAddress);

        // check allowance, if it is not enough, we ask for allowance
        if (BigInt(vesting) >= BigInt(allowance)) {
            await allowTokens(marketAddress, vesting);
        }
        const tx = await eth.contracts.marketERC721.createSFA(cid, vesting, startTime, ttl);
        const receipt = await tx.wait();
        console.log(`SFA was registered on, tx hash: (${receipt.transactionHash})`);
    } catch (error) {
        console.log("Error at Host Registry:", error);
    }
};

const hostSFA = async (sfaCounter: number) => {
    try {
        await eth.contracts.marketERC721.claimHost(sfaCounter);
        const sfa = await eth.contracts.marketERC721.sfas(sfaCounter);
        if (sfa === null) {
            throw new Error("Failed to fetch the latest block.");
        }
        const sfaStruct = {
            publisher: sfa[0],
            cid: sfa[1],
            vesting: sfa[2],
            vested: sfa[3],
            startTime: sfa[4],
            ttl: sfa[5],
            status: sfa[6],
            host: sfa[7],
            pendingHost: sfa[8],
            collateral: sfa[9],
        };
        await pinCID(sfaStruct.cid);
        console.log(`SFA hosted with cid ${sfaStruct.cid} and sfaCounter: ${sfaCounter}`);
    } catch (error) {
        console.log("Error at fetching a host:", error);
    }
};

const menuOptions = async () => {
    console.log("\n"); // white line space
    const questions = [
        {
            type: "list",
            name: "option",
            message: "Select operation:",
            choices: [
                {name: "List active orders", value: "listActiveOrders"},
                {name: "Get local IPFS node info", value: "getLocalNodeInfo"},
                {name: "Get smart contract taken orders", value: "getSmartContractOrders"},
                {name: "List dialed peers", value: "listDialedPeers"},
                {name: "Dial a multiaddrs", value: "dialMultiaddrs"},
                {name: "Dial a peerId", value: "dialPeerId"},
                {name: "Hang up a peerId", value: "hangUpPeerId"},
                {name: "Publish Data to IPFS", value: "publishDataToIPFS"},
                {name: "Pin a CID", value: "pinCID"},
                {name: "Unpin a CID", value: "unpinCID"},
                {name: "Account Balance", value: "accountBalance"},
                {name: "Change Wallet", value: "changeWallet"},
                {name: "Register & Dial Host", value: "registerDialHost"},
                {name: "Fetch & Dial Host", value: "fetchDialHost"},
                {name: "Approve Market to spend Tokens", value: "allowTokensToMarket"},
                {name: "Publish SFA", value: "publishSFA"},
                {name: "Host SFA", value: "hostSFA"},
                {name: "Turn off", value: "turnOff"},
            ],
        },
    ];

    const actions: {[key: string]: any} = {
        turnOff: async () => {
            await turnOff();
        },
        getLocalNodeInfo: async () => {
            await printLocalPeerData();
            menuOptions();
        },
        getSmartContractOrders: async () => {
            await getStorageOrders();
            menuOptions();
        },
        listDialedPeers: async () => {
            await printDialedPeers();
            menuOptions();
        },
        dialMultiaddrs: async () => {
            const {addrs} = await inquirer.prompt([
                {type: "input", name: "addrs", message: "Please input the peer multiaddrs:"},
            ]);
            await dialAMultiaddr(addrs);
            menuOptions();
        },
        dialPeerId: async () => {
            const {addrs} = await inquirer.prompt([
                {type: "input", name: "addrs", message: "Please input the peerID:"},
            ]);
            await dialAPeerID(addrs);
            menuOptions();
        },
        hangUpPeerId: async () => {
            printNumerableDialedPeers();
            const {addrs} = await inquirer.prompt([
                {type: "input", name: "addrs", message: "Please input a number to hang up:"},
            ]);
            await hangUpAPeer(addrs);
            menuOptions();
        },
        listActiveOrders: async () => {
            await printNumerableOrders();
            menuOptions();
        },
        publishDataToIPFS: async () => {
            const {data} = await inquirer.prompt([{type: "input", name: "data", message: "Please input Data:"}]);
            await pushData(data);
            menuOptions();
        },
        pinCID: async () => {
            const {cidString} = await inquirer.prompt([
                {type: "input", name: "cidString", message: "Please input CID to pin:"},
            ]);
            await pinCID(cidString);
            menuOptions();
        },
        unpinCID: async () => {
            await printNumerableOrders();
            const {index} = await inquirer.prompt([
                {type: "input", name: "index", message: "Please input a number to unpin:"},
            ]);
            await unPinCID(index);
            menuOptions();
        },
        accountBalance: async () => {
            const {account} = await inquirer.prompt([
                {
                    type: "input",
                    name: "account",
                    message: "Please input an ethereum address:",
                    default: `${await eth.wallet.getAddress()}`,
                },
            ]);
            await balanceERC20(account);
            menuOptions();
        },
        changeWallet: async () => {
            const {pKey} = await inquirer.prompt([
                {type: "input", name: "pKey", message: "Please input a private key:"},
            ]);
            await importPKey(pKey);
            menuOptions();
        },
        registerDialHost: async () => {
            const {addrs} = await inquirer.prompt([
                {type: "input", name: "addrs", message: "Please input a host multiaddr:"},
            ]);
            await registerHost(addrs);
            menuOptions();
        },
        fetchDialHost: async () => {
            const {addrs} = await inquirer.prompt([
                {type: "input", name: "addrs", message: "Please input a host eth Address:"},
            ]);
            await fetchHost(addrs);
            menuOptions();
        },
        transferTokens: async () => {
            const {to} = await inquirer.prompt([
                {type: "input", name: "to", message: "Please input an Ethereum Address:"},
            ]);
            const {amount} = await inquirer.prompt([
                {type: "input", name: "amount", message: "Please input the Tokens amount:"},
            ]);
            await transferTokens(to, amount);
            await balanceERC20();
            menuOptions();
        },
        allowTokensToMarket: async () => {
            const {amount} = await inquirer.prompt([
                {type: "input", name: "amount", message: "Please input the Tokens amount to allow:"},
            ]);
            await allowTokens(await eth.contracts.marketERC721.getAddress(), amount);
            menuOptions();
        },
        publishSFA: async () => {
            const {data} = await inquirer.prompt([{type: "input", name: "data", message: "Please input Data:"}]);
            const {vesting} = await inquirer.prompt([
                {type: "input", name: "vesting", message: "Please input vesting amount:"},
            ]);

            const {_startTime} = await inquirer.prompt([
                {
                    type: "input",
                    name: "_startTime",
                    message: "Please input start time format in UTC ( AAAA-MM-DD hh:mm:ss ):",
                },
            ]);
            let startTime = DateTime.fromFormat(_startTime, "yyyy-MM-dd HH:mm:ss").toUnixInteger();

            const {_endTime} = await inquirer.prompt([
                {
                    type: "input",
                    name: "_endTime",
                    validate: (input, answer) => {
                        let endTime = DateTime.fromFormat(input, "yyyy-MM-dd HH:mm:ss").toUnixInteger();
                        if (endTime > startTime) return true;
                        return "end-time should be older than start-time";
                    },
                    message: "Please input end time format in UTC ( AAAA-MM-DD hh:mm:ss ):",
                },
            ]);

            let endTime = DateTime.fromFormat(_endTime, "yyyy-MM-dd HH:mm:ss").toUnixInteger();
            const ttl = endTime - startTime;

            try {
                await pushData(data);
                let cid = storageOrders[storageOrders.length - 1].toString();

                await createSFA(vesting, cid, _startTime, ttl);
            } catch (error) {
                console.log("Error at Host Registry:", error);
            }
            menuOptions();
        },
        hostSFA: async () => {
            const {sfaId} = await inquirer.prompt([
                {type: "input", name: "sfaId", message: "Please input SFA index nunmber:"},
            ]);
            await hostSFA(Number(sfaId));
            menuOptions();
        },
    };

    const {option} = await inquirer.prompt(questions);
    const action = actions[option];

    if (typeof action === "function") {
        await action();
    } else {
        throw new Error("Invalid option");
    }
};

const setup = async () => {
    const questions = [
        {
            name: "PRIVATE_KEY",
            type: "password",
            mask: "*",
            message: `Enter a host private key (0x${"*".repeat(
                CONSTANTS.PRIVATE_KEY.length - 3
            )}${CONSTANTS.PRIVATE_KEY.slice(-6)})`,
            default: `${CONSTANTS.PRIVATE_KEY}`,
            validate: (input: string) => {
                if (ethers.isHexString(input)) {
                    return true;
                } else {
                    if (input.length === 64) {
                        return ethers.isHexString(`0x${input}`);
                    }
                    return "wrong private key format";
                }
            },
        },
        {
            name: "savePrivateKey",
            type: "confirm",
            message: "save private key in local file? (Y/n)",
        },
        {
            name: "PROVIDER_URL",
            type: "input",
            message: "Provider JSON RPC url:",
            default: `${CONSTANTS.PROVIDER_URL}`,
            validate: (value: string) => {
                if (value.length) {
                    return true;
                } else {
                    return "Please enter your name";
                }
            },
        },
        {
            type: "confirm",
            name: "ok",
            message: "confirm to start? (Y/n)",
        },
    ];

    const res = await inquirer.prompt(questions);
    if (res.savePrivateKey) utils.updateEnvFile("PRIVATE_KEY", res.PRIVATE_KEY);
    return res.ok;
};

const main = async () => {
    let ok = false;

    while (!ok) {
        ok = await setup();
        try {
            console.log(chalk.whiteBright.bold("Initializing Ethers"));
            eth = await initEthers();
            console.log(`${chalk.white.bold("✅ Ethers Ready!")}
- ${chalk.bold("provider:")} ${chalk.gray(CONSTANTS.PROVIDER_URL)}
- ${chalk.bold("Wallet address:")} ${chalk.gray(eth.wallet.address)}
- ${chalk.bold("SFA address:")} ${chalk.gray(await eth.contracts.tokenERC20.getAddress())}
- ${chalk.bold("Market Contract address:")} ${chalk.gray(await eth.contracts.marketERC721.getAddress())}
`);

            console.log(chalk.whiteBright.bold("Initializing Helia"));
            ipfs = await initHelia();
            const multiaddresses: string[] = ipfs.node?.libp2p.getMultiaddrs();
            console.log(`${chalk.white.bold("✅ Helia Ready!")}
- ${chalk.bold("PeerId")} ${chalk.gray(ipfs.node?.libp2p.peerId.toString())});
- ${chalk.bold("MultiAddress of your local IPFS Node")} \n${chalk.gray(multiaddresses.join("\n"))}
`);
        } catch (error) {
            console.error("Error initializing modules:", error);
            ok = false;
        }
    }
    await menuOptions();
};

await main();
