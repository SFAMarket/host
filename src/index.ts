/* eslint-disable no-console */
import {CID} from "multiformats/cid";
import {multiaddr, isMultiaddr} from "@multiformats/multiaddr";
import {peerIdFromString} from "@libp2p/peer-id";
import {PeerId} from "@libp2p/interface";
import initEthers from "./modules/ethers.ts";
import initHelia from "./modules/helia.ts";
import {JsonRpcProvider, Wallet, Contract, formatUnits, formatEther, parseUnits, parseEther} from "ethers";
import inquirer from "inquirer";

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

async function main() {
    // Setup and Initialize
    try {
        console.log("initializing Ethers");
        eth = await initEthers();
        console.log("Ethers Ready!");
        console.log("initializing Helia");
        ipfs = await initHelia();
        console.log("Helia Ready!");
    } catch (error) {
        console.error("Error initializing modules:", error);
    }
}

// async function mainMenu(rl: readline.Interface) {
//     menuOptions(rl);
// }

// function menuOptions(rl: readline.Interface) {
//     rl.question(
//         "Select operation: \n \
// Options: \n \
// [0]: Exit \n \
// [1]: Print menu \n \
// [2]: Get local node info \n \
// [3]: Get eth linked data\n \
// [4]: Get smart contract taken orders\n \
// [5]: List dialed peers\n \
// [6]: Dial a multiaddrs\n \
// [7]: Dial a peerId\n \
// [8]: Hang up a peerId\n \
// [9]: List active orders\n \
// [10]: Publish Data to IPFS\n \
// [11]: Read IPFS Data\n \
// [12]: Pin a CID\n \
// [13]: Unpin a CID\n \
// [14]: Account Blance\n \
// [15]: Change Wallet\n \
// [16]: Register & Dial Host\n \
// [17]: Fetch & Dial Host\n \
// [18]: Transfer Tokens\n \
// [19]: Transfer ETH\n \
// [20]: Allow Tokens to Market\n \
// [21]: Publish SFA\n \
// [22]: Host SFA\n \
// Option:",
//         async (answer: string) => {
//             console.log(`Selected: ${answer}\n`);
//             const option = Number(answer);
//             switch (option) {
//                 case 0:
//                     closeHelia();
//                     rl.close();
//                     return;
//                 case 1:
//                     mainMenu(rl);
//                     return;
//                 case 2:
//                     await printLocalPeerData();
//                     mainMenu(rl);
//                     break;
//                 case 3:
//                     await printEthStruct();
//                     mainMenu(rl);
//                     break;
//                 case 4:
//                     await getStorageOrders();
//                     mainMenu(rl);
//                     break;
//                 case 5:
//                     await printDialedPeers();
//                     mainMenu(rl);
//                     break;
//                 case 6:
//                     rl.question("please input the peer multiaddrs:", async (addrs) => {
//                         await DialAMultiaddr(addrs);
//                         mainMenu(rl);
//                     });
//                     break;
//                 case 7:
//                     rl.question("please input the peerID:", async (addrs) => {
//                         await DialAPeerID(addrs);
//                         mainMenu(rl);
//                     });
//                     break;
//                 case 8:
//                     printNumerableDialedPeers();
//                     rl.question("please input a number to hangHup:", async (addrs) => {
//                         await hangUpAPeer(addrs);
//                         mainMenu(rl);
//                     });
//                     break;
//                 case 9:
//                     await printNumerableOrders();
//                     mainMenu(rl);
//                     break;
//                 case 10:
//                     rl.question("please input Data:", async (data) => {
//                         await pushData(data);
//                         mainMenu(rl);
//                     });
//                     break;
//                 case 11:
//                     await printNumerableOrders();
//                     rl.question("please input a number of Order:", async (order) => {
//                         await getData(order);
//                         mainMenu(rl);
//                     });
//                     break;
//                 case 12:
//                     rl.question("please input CID to pin:", async (cidString) => {
//                         await pinCID(cidString);
//                         mainMenu(rl);
//                     });
//                     break;
//                 case 13:
//                     await printNumerableOrders();
//                     rl.question("please input a number to upin:", async (index) => {
//                         await unPinCID(index);
//                         mainMenu(rl);
//                     });
//                     break;
//                 case 14:
//                     await balanceERC20();
//                     mainMenu(rl);
//                     break;
//                 case 15:
//                     rl.question("please input a private key:", async (pKey) => {
//                         await importPKey(pKey);
//                         mainMenu(rl);
//                     });
//                     break;
//                 case 16:
//                     rl.question("please input a host multiaddr:", async (addrs) => {
//                         await registerHost(addrs);
//                         mainMenu(rl);
//                     });
//                     break;
//                 case 17:
//                     rl.question("please input a host eth Address:", async (addrs) => {
//                         await fetchHost(addrs);
//                         mainMenu(rl);
//                     });
//                     break;
//                 case 18:
//                     rl.question("please input an Ethereum Address:", async (to) => {
//                         rl.question("please input the Tokens amount:", async (amount) => {
//                             await transferTokens(to, amount);
//                             await balanceERC20();
//                             mainMenu(rl);
//                         });
//                     });
//                     break;
//                 case 19:
//                     rl.question("please input an Ethereum Address:", async (to) => {
//                         rl.question("please input the ETH amount:", async (amount) => {
//                             await transferETH(to, amount);
//                             await balanceERC20();
//                             mainMenu(rl);
//                         });
//                     });
//                     break;
//                 case 20:
//                     rl.question("please input the Tokens amount to allow:", async (amount) => {
//                         await allowTokens(await eth.contracts.marketERC721.getAddress(), amount);
//                         mainMenu(rl);
//                     });
//                     break;
//                 case 21:
//                     rl.question("please input Data:", async (data) => {
//                         rl.question("please input vesting amount:", async (vesting) => {
//                             rl.question("please input start time(seconds:)", async (startTime) => {
//                                 rl.question("please input SFAs TTL(seconds:)", async (TTL) => {
//                                     try {
//                                         await pushData(data);
//                                         let cid = storageOrders[storageOrders.length - 1].toString();
//                                         await createSFA(
//                                             vesting,
//                                             cid,
//                                             await getTimeStamp(startTime),
//                                             await getTimeStamp(TTL)
//                                         );
//                                     } catch (error) {
//                                         console.log("Error at Host Registry:", error);
//                                     }
//                                     mainMenu(rl);
//                                 });
//                             });
//                         });
//                     });
//                     break;
//                 case 22:
//                     await hostSFA();
//                     mainMenu(rl);
//                     break;
//                 default:
//                     throw new Error("Invalid option");
//             }
//         }
//     );
// }

async function getStorageOrders() {
    // Add logic
    const sfaAddress: string = await eth.contracts.tokenERC20.getAddress();
    console.log("Greeting from contract SFA:", sfaAddress);
    const marketAddress: string = await eth.contracts.marketERC721.getAddress();
    console.log("Greeting from contract Market:", marketAddress);
}

async function printLocalPeerData() {
    console.info("Helia is running");
    console.info("PeerId:", ipfs.node?.libp2p.peerId.toString());
    console.info("MultiAddress of this Node:");
    const addr = ipfs.node?.libp2p.getMultiaddrs();
    console.log(addr);
}

async function printEthStruct() {
    console.log("Provider:", eth.provider);
    console.log("Wallet address:", eth.wallet.address);
    console.log("SFA address:", await eth.contracts.tokenERC20.getAddress());
    console.log("Market Contract address:", await eth.contracts.marketERC721.getAddress());
    //console.log('ABI:', eth.abiSFA);
    //console.log('ABI:', eth.abiMarket);
}

async function printDialedPeers() {
    dialedPeers = ipfs.node?.libp2p.getPeers();
    console.log("The following peers are dialing:");
    console.log(dialedPeers);
}

async function DialAPeerID(peer: string) {
    // Check tipes and merge reduce code duplication with dialMulltiaddr
    // ToDo: Use isName to check dns strings
    try {
        console.log("Dialing {peer}...");
        const dialPeerID = peerIdFromString(peer);
        await ipfs.node?.libp2p.dial(dialPeerID);
        console.log("OK: dialed:", dialPeerID);
    } catch (error) {
        console.log("Error: ", error);
    }
}

async function DialAMultiaddr(addrs: string) {
    // ToDo: Use isName to check dns strings
    const peerMultiAddr = multiaddr(addrs);
    try {
        if (isMultiaddr(peerMultiAddr)) {
            await ipfs.node?.libp2p.dial(peerMultiAddr);
            console.log("dialed:", peerMultiAddr);
        }
    } catch (error) {
        console.log("Error: ", error);
    }
}

function printNumerableDialedPeers(): void {
    dialedPeers = ipfs.node?.libp2p.getPeers();
    for (let [index, element] of dialedPeers.entries()) {
        console.log(`${index} is peerID: ${element.toString()}`);
    }
}

async function hangUpAPeer(index: string) {
    let hangUpPeerId = dialedPeers[Number(index)];
    try {
        await ipfs.node?.libp2p.hangUp(hangUpPeerId);
        console.log(`peerID: ${hangUpPeerId.toString()},\n hanged Up`);
    } catch (error) {
        console.log("Error: ", error);
    }
}

async function printNumerableOrders() {
    // TODO: Add pinned status ans structs
    // verify with blockchain
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
}

// This puts data into the Helia Node
async function pushData(data: string) {
    const encoder = new TextEncoder();
    const cid = await ipfs.fs.addBytes(encoder.encode(data), {
        onProgress: (evt: any) => {
            console.info("add event", evt.type, evt.detail);
        },
    });
    storageOrders.push(cid);
    console.log("Added file:", cid.toString());
    return cid.toString();
}

// This gets data from the Helia Node and decodes it
async function getData(orderIdx: string) {
    // this decoder will turn Uint8Arrays into strings
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
    //return text
}

async function pinCID(cidString: string) {
    const cid2Pin = CID.parse(cidString);
    try {
        ipfs.node?.pins.add(cid2Pin);
        storageOrders.push(cid2Pin);
        console.log("pinned CID:", cidString);
    } catch (error) {
        console.log("Pinning CID Error:", error);
    }
}

// for now is local CID
async function unPinCID(index: number) {
    const idxNum: number = +index;
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
}

async function closeHelia() {
    console.log("Closing session...");
    await ipfs.node?.stop();
    console.log("Good bye ;)");
}

// Protocol Functions
async function balanceERC20(address?: string) {
    console.log("EOAccount is:", eth.wallet.getAddress());
    const walletAddress = address || eth.wallet.getAddress();
    const decimals = await eth.contracts.tokenERC20.decimals();
    const sfaBalance = await eth.contracts.tokenERC20.balanceOf(walletAddress);
    console.log("SFA Balance:", formatUnits(sfaBalance.toString(), decimals));
    const ethBalance = await eth.provider.getBalance(walletAddress);
    console.log("ETH Balance:", formatEther(ethBalance));
}

async function importPKey(pKey: string) {
    try {
        eth = await initEthers(pKey);
        console.log("new EOAccount is:", eth.wallet.getAddress());
    } catch (error) {
        console.log("Error on importPKey:", error);
    }
}

async function registerHost(multiAddrs: string) {
    try {
        const tx = await eth.contracts.marketERC721.registerHost(multiAddrs);
        const receipt = await tx.wait();
        // ToDO Catch Error if reverted and do not dial
        console.log(`The host was registered (${receipt.transactionHash})`);
        // dial host (must be accessible multiaddrs)
        await DialAMultiaddr(multiAddrs);
    } catch (error) {
        console.log("Error at Host Registry:", error);
    }
}

async function fetchHost(addrs: string) {
    try {
        const result = await eth.contracts.marketERC721.hosts(addrs);
        const host: Host = {
            status: result[0],
            multiAddrs: result[1],
        };
        console.log("Host Status:", host.status);
        console.log("Host Multiaddress:", host.multiAddrs);
        // ask if you want to dial from outside cli?
        if (host) {
            await DialAMultiaddr(host.multiAddrs);
        }
    } catch (error) {
        console.log("Error at fetching a host:", error);
    }
}

//Transfer ERC20
async function transferTokens(to: string, amount: string) {
    const decimals = await eth.contracts.tokenERC20.decimals();
    const tokenAmount = parseUnits(amount, decimals);
    try {
        const tx = await eth.contracts.tokenERC20.transfer(to, tokenAmount);
        const receipt = await tx.wait();
        console.log(`The ${tokenAmount} tokens where sent to ${to}\n  on TxID: (${receipt})`);
    } catch (error) {
        console.log("Error transfering tokens:", error);
    }
}

//Give Allowance
async function allowTokens(to: string, amount: string) {
    const decimals = await eth.contracts.tokenERC20.decimals();
    const tokenAmount = parseUnits(amount, decimals);
    try {
        const tx = await eth.contracts.tokenERC20.approve(to, tokenAmount);
        const receipt = await tx.wait();
        console.log(`The ${tokenAmount} Tokens where approved to ${to}\n  on TxID: (${receipt})`);
    } catch (error) {
        console.log("Error transfering tokens:", error);
    }
}

//Transfer ETH
async function transferETH(to: string, amount: string) {
    const value = parseEther(amount);
    const tx = {
        to: to,
        value: value,
    };
    try {
        const txResponse = await eth.wallet.sendTransaction(tx);
        const receipt = await txResponse.wait();
        console.log(`The ${value} ETH where sent to ${to}\n  on TxID: (${receipt})`);
    } catch (error) {
        console.log("Error transfering ETH:", error);
    }
}

async function getTimeStamp(secondsToAdd: string): Promise<string> {
    const latestBlock = await eth.provider.getBlock("latest");

    if (latestBlock === null) {
        throw new Error("Failed to fetch the latest block.");
    }
    const newTimestamp = latestBlock.timestamp + secondsToAdd;

    return newTimestamp.toString();
}

// ToDo and test
// SFA Logic To Test, right now only stores CID for Proof of COncept
async function createSFA(vesting: string, cid: string, startTime: string, ttl: string) {
    try {
        const tx = await eth.contracts.marketERC721.createSFA(cid, vesting, startTime, ttl);
        const receipt = await tx.wait();
        console.log(`SFA was registered on (${receipt.transactionHash})`);
    } catch (error) {
        console.log("Error at Host Registry:", error);
    }
}

async function hostSFA() {
    try {
        const sfaCounter = await eth.contracts.marketERC721.sfaCounter();
        await eth.contracts.marketERC721.claimHost(sfaCounter);
        const sfa = await eth.contracts.marketERC721.sfas(sfaCounter);
        if (sfa === null) {
            throw new Error("Failed to fetch the latest block.");
        }
        const sfaStruct: SFA = {
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
}

// main().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// });

inquirer
    .prompt([
        {
            type: "list",
            name: "theme",
            message: "What do you want to do?",
            choices: [
                "Order a pizza",
                "Make a reservation",
                new inquirer.Separator(),
                "Ask for opening hours",
                {
                    name: "Contact support",
                    disabled: "Unavailable at this time",
                },
                "Talk to the receptionist",
            ],
        },
        {
            type: "list",
            name: "size",
            message: "What size do you need?",
            choices: ["Jumbo", "Large", "Standard", "Medium", "Small", "Micro"],
            filter(val) {
                return val.toLowerCase();
            },
        },
    ])
    .then((answers) => {
        console.log(JSON.stringify(answers, null, "  "));
    });
