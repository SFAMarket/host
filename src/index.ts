/* eslint-disable no-console */
import chalk from "chalk";
import bytes from "bytes";
import {CID} from "multiformats/cid";
import {multiaddr, isMultiaddr, Multiaddr} from "@multiformats/multiaddr";
import {peerIdFromString} from "@libp2p/peer-id";
import {PeerId} from "@libp2p/interface";
import initEthers from "./modules/ethers.ts";
import initHelia from "./modules/helia.ts";
import {ethers} from "ethers";
import inquirer from "inquirer";
import {DateTime} from "luxon";
import * as utils from "./modules/utils.ts";
import * as CONSTANTS from "./config/constants.ts";
import {EthersStruct, IpfsStruct, SFA} from "../types/interfaces.ts";
import {UnixFSStats} from "@helia/unixfs";

let interval: NodeJS.Timeout;
let eth: EthersStruct;
let ipfs: IpfsStruct;
let dialedPeers: PeerId[] = [];
let storageOrders: CID[] = [];
let SFAs: SFA[] = [];

/**
 * Actions
 */

/**
 * IPFS actions
 */
const getLocalNodeInfo = async () => {
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

const unpinCID = async (index: number) => {
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

const getCIDStats = async (cid: string) => {
    // example: QmWBaeu6y1zEcKbsEqCuhuDHPL3W8pZouCPdafMCRCSUWk
    try {
        const stats: UnixFSStats = await ipfs.fs.stat(CID.parse(cid));
        console.log(`CID: ${cid}`);
        console.log(`type: ${stats.type}`);
        console.log(`Dag size: ${bytes(stats.dagSize)}`);
        console.log(`File size: ${bytes(stats.fileSize)}`);
    } catch (error) {
        console.log({error});
    }
};

const turnOffHelia = async () => {
    console.clear();
    console.log("Closing helias");
    await ipfs.node?.stop();
    console.log("✅ Done");
    console.log("👋 See ya");
};

/**
 * SFA Market
 */
const turnOnInterval = () => {
    interval = setInterval(autoHost, 1000);
};

const createSFA = async (vesting: number, cid: string, startTime: number, ttl: number) => {
    try {
        const walletAddress = eth.wallet.address;
        const marketAddress = await eth.contracts.marketERC721.getAddress();
        const allowance = await eth.contracts.tokenERC20.allowance(walletAddress, marketAddress);

        // check allowance, if it is not enough, we ask for allowance
        if (BigInt(vesting) >= BigInt(allowance)) {
            await approveToken(marketAddress, vesting);
        }
        const tx = await eth.contracts.marketERC721.createSFA(cid, vesting, startTime, ttl);
        const receipt = await tx.wait();
        console.log(`SFA was registered on, tx hash: (${receipt.transactionHash})`);
    } catch (error) {
        console.log("Error at Host Registry:", error);
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

/**
 * auto Host
 * @description check available SFA that match with preferences
 */
const autoHost = async () => {
    try {
    } catch (error) {
        console.log("Error at auto host:", error);
    }
};

/**
 * Fetch SFAs
 * @description fetch SFA from Market and stored in SFA global Variable.
 */
const fetchSFAs = async () => {
    try {
        // use multicall to get all SFAs
    } catch (error) {
        console.log("Error at fetching a host:", error);
    }
};

const hostSFA = async (sfaCounter: number) => {
    try {
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

/**
 * Wallet
 */

const balanceERC20 = async (address?: string) => {
    const walletAddress = address || (await eth.wallet.getAddress());
    const decimals = await eth.contracts.tokenERC20.decimals();
    const sfaBalance = await eth.contracts.tokenERC20.balanceOf(walletAddress);
    console.log("SFA Balance:", ethers.formatUnits(sfaBalance.toString(), decimals));
    const ethBalance = await eth.provider.getBalance(walletAddress);
    console.log("ETH Balance:", ethers.formatEther(ethBalance));
};

const transferTokens = async (to: string, amount: string) => {
    const decimals = await eth.contracts.tokenERC20.decimals();
    const tokenAmount = ethers.parseUnits(amount, decimals);
    try {
        const tx = await eth.contracts.tokenERC20.transfer(to, tokenAmount);
        const receipt = await tx.wait();
        console.log(`The ${tokenAmount} tokens were sent to ${to}\n  on TxID: (${receipt})`);
    } catch (error) {
        console.log("Error transferring tokens:", error);
    }
};

const approveTokenMax = async (to: string) => {
    const tokenAmount = ethers.MaxUint256;
    try {
        const tx = await eth.contracts.tokenERC20.approve(to, tokenAmount.toString());
        const receipt = await tx.wait();
        console.log(`The ${tokenAmount} Tokens were approved to ${to}\n  on TxID: (${receipt})`);
    } catch (error) {
        console.log("Error transferring tokens:", error);
    }
};

const approveToken = async (to: string, amount: number) => {
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

/**
 * Main Actions
 */

const menuOptions = async () => {
    console.log("\n"); // white line space
    const questions = [
        {
            type: "list",
            name: "option",
            message: "Select operation:",
            choices: [
                new inquirer.Separator("--- IPFS ---"),
                {name: "Pin a CID", value: "pinCID"},
                {name: "Unpin a CID", value: "unpinCID"},
                {name: "Get CID stats", value: "getCIDStats"},
                {name: "Get local IPFS node info", value: "getLocalNodeInfo"},
                {name: "List dialed peers", value: "listDialedPeers"},
                {name: "Dial a multiaddrs", value: "dialMultiaddrs"},
                {name: "Dial a peerId", value: "dialPeerId"},
                {name: "Hang up a peerId", value: "hangUpPeerId"},
                {name: "Publish Data to IPFS", value: "publishDataToIPFS"},
                new inquirer.Separator("--- SFA Market ---"),
                {name: "Turn on/off Auto Host", value: "turnOnAutoHost"},
                {name: "Publish SFA", value: "publishSFA"},
                {name: "Fetch SFAs", value: "fetchSFAs"},
                {name: "Host SFA", value: "hostSFA"},
                {name: "Register & Dial Host", value: "registerDialHost"},
                {name: "Fetch & Dial Host", value: "fetchDialHost"},
                new inquirer.Separator("--- Wallet ---"),
                {name: "Approve SFA Market to Max spend tokens", value: "approveTokenMax"},
                {name: "Approve custom Address to Spend tokens", value: "approveToken"},
                {name: "Account Balance", value: "accountBalance"},
                new inquirer.Separator("--- Helia ---"),
                {name: "exit", value: "turnOffHelia"},
            ],
        },
    ];

    const actions: {[key: string]: any} = {
        turnOffHelia: async () => {
            await turnOffHelia();
        },
        getCIDStats: async () => {
            try {
                const {cid} = await inquirer.prompt([{type: "input", name: "cid", message: "Please input CID:"}]);
                await getCIDStats(cid);
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        getLocalNodeInfo: async () => {
            try {
                await getLocalNodeInfo();
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        listDialedPeers: async () => {
            try {
                await printDialedPeers();
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        dialMultiaddrs: async () => {
            try {
                const {addrs} = await inquirer.prompt([
                    {type: "input", name: "addrs", message: "Please input the peer multiaddrs:"},
                ]);
                await dialAMultiaddr(addrs);
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        dialPeerId: async () => {
            try {
                const {addrs} = await inquirer.prompt([
                    {type: "input", name: "addrs", message: "Please input the peerID:"},
                ]);
                await dialAPeerID(addrs);
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        hangUpPeerId: async () => {
            try {
                printNumerableDialedPeers();
                const {addrs} = await inquirer.prompt([
                    {type: "input", name: "addrs", message: "Please input a number to hang up:"},
                ]);
                await hangUpAPeer(addrs);
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        publishDataToIPFS: async () => {
            try {
                const {data} = await inquirer.prompt([{type: "input", name: "data", message: "Please input Data:"}]);
                await pushData(data);
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        pinCID: async () => {
            try {
                const {cidString} = await inquirer.prompt([
                    {type: "input", name: "cidString", message: "Please input CID to pin:"},
                ]);
                await pinCID(cidString);
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        unpinCID: async () => {
            try {
                const {index} = await inquirer.prompt([
                    {type: "input", name: "index", message: "Please input a number to unpin:"},
                ]);
                await unpinCID(index);
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        accountBalance: async () => {
            try {
                const {account} = await inquirer.prompt([
                    {
                        type: "input",
                        name: "account",
                        message: "Please input an ethereum address:",
                        default: `${await eth.wallet.getAddress()}`,
                    },
                ]);
                await balanceERC20(account);
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        registerDialHost: async () => {
            try {
                const {addrs} = await inquirer.prompt([
                    {type: "input", name: "addrs", message: "Please input a host multiaddr:"},
                ]);
                await registerHost(addrs);
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        fetchDialHost: async () => {
            try {
                const {addrs} = await inquirer.prompt([
                    {type: "input", name: "addrs", message: "Please input a host eth Address:"},
                ]);
                await fetchHost(addrs);
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        transferTokens: async () => {
            try {
                const {to} = await inquirer.prompt([
                    {type: "input", name: "to", message: "Please input an Ethereum Address:"},
                ]);
                const {amount} = await inquirer.prompt([
                    {type: "input", name: "amount", message: "Please input the Tokens amount:"},
                ]);
                await transferTokens(to, amount);
                await balanceERC20();
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        approveTokenMax: async () => {
            try {
                const {ok} = await inquirer.prompt([
                    {type: "confirm", name: "ok", message: "Approve Market to Max Spend Token: "},
                ]);
                if (ok) {
                    await approveTokenMax(await eth.contracts.marketERC721.getAddress());
                } else {
                    console.log("approve canceled");
                }
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        approveToken: async () => {
            try {
                const martketAddress = await eth.contracts.marketERC721.getAddress();
                const {amount, target} = await inquirer.prompt([
                    {
                        type: "input",
                        name: "target",
                        message: "Address allow to spend:",
                        default: `${martketAddress}`,
                        validate: (input: string) => {
                            if (ethers.isHexString(input) && input.length === 42) return true;
                            return "wrong private key format";
                        },
                    },
                    {type: "number", name: "amount", message: "Please input the Tokens amount to allow:"},
                ]);
                await approveToken(target, amount);
            } catch (error) {
                console.log("catch error:", error);
            }
            menuOptions();
        },
        publishSFA: async () => {
            try {
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

                await pushData(data);
                let cid = storageOrders[storageOrders.length - 1].toString();

                await createSFA(vesting, cid, _startTime, ttl);
            } catch (error) {
                console.log("Error at Host Registry:", error);
            }
            menuOptions();
        },
        hostSFA: async () => {
            try {
                const {sfaId} = await inquirer.prompt([
                    {type: "input", name: "sfaId", message: "Please input SFA index nunmber:"},
                ]);
                await hostSFA(Number(sfaId));
            } catch (error) {
                console.log("catch error:", error);
            }
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
            name: "PRIVATE_KEY",
            type: "password",
            mask: "*",
            message: `Enter a host private key ${chalk.dim(
                "(0x" + "*".repeat(CONSTANTS.PRIVATE_KEY.length - 3)
            )}${chalk.dim(CONSTANTS.PRIVATE_KEY.slice(-6) + ")")}`,
            default: `${CONSTANTS.PRIVATE_KEY}`,
            validate: (input: string) => {
                if (ethers.isHexString(input) && input.length == 66) return true;
                else return "wrong private key format";
            },
        },
        {
            name: "savePrivateKey",
            type: "confirm",
            message: "save private key in .env file? (Y/n)",
        },
        {
            name: "AUTO_HOST",
            type: "confirm",
            mask: "*",
            message: `Want to auto host?`,
            default: CONSTANTS.AUTO_HOST,
        },
    ];

    console.log(`
${chalk.bold.whiteBright("👋 Hello there!")}
${chalk.gray("this is a fast setup for your host in SFA.")}
${chalk.gray("follow questions to start hosting.")}
`);

    const res = await inquirer.prompt(questions);
    if (res.savePrivateKey) utils.updateEnvFile("PRIVATE_KEY", res.PRIVATE_KEY);
    if (typeof res.AUTO_HOST == "boolean") utils.updateEnvFile("AUTO_HOST", res.AUTO_HOST);

    // Inner loop for config auto host
    if (res.AUTO_HOST === true) {
        console.clear();
        console.log(chalk.white.bold("Set Up Auto Host preferences:"));
        let ok: boolean = false;
        const questions = [
            {
                name: "BYTE_PER_VESTING",
                type: "number",
                message: `Byte Per Vesting?`,
                default: CONSTANTS.BYTE_PER_VESTING,
            },
            {
                name: "MIN_VESTING_REWARDS",
                type: "number",
                message: `Minimum Vesting Rewards:`,
                default: CONSTANTS.MIN_COLLATERAL_RATIO_BPS,
            },
            {
                name: "MAX_COLLATERAL_RAITO_BPS",
                type: "number",
                message: `Maximum Collateral Ratio in BPS ${chalk.gray("( 10e3 = 100 %) ")}`,
                default: CONSTANTS.MAX_COLLATERAL_RAITO_BPS,
            },
            {
                name: "MAX_CID_SIZE",
                type: "string",
                message: `Maximum CID Size`,
                validate: (input: string) => {
                    try {
                        const regex = /^\d+(\.\d+)?\s?(B|KB|MB|GB|TB|PB|EB|ZB|YB)$/i;
                        if (regex.test(input)) return true;
                        return "wrong format";
                    } catch (error) {
                        return "wrong format";
                    }
                },
                default: CONSTANTS.MAX_CID_SIZE,
            },
            {
                name: "MAX_DISK_USE",
                type: "string",
                message: `Maximum Disk Use:`,
                validate: (input: string) => {
                    try {
                        const regex = /^\d+(\.\d+)?\s?(B|KB|MB|GB|TB|PB|EB|ZB|YB)$/i;
                        if (regex.test(input)) return true;
                        return "wrong format";
                    } catch (error) {
                        return "wrong format";
                    }
                },
                default: CONSTANTS.MAX_DISK_USE,
            },
        ];
        while (!ok) {
            const res = await inquirer.prompt(questions);
            console.log(`
${chalk.bold("BYTE_PER_VESTING:")} ${chalk.dim(res.BYTE_PER_VESTING)}
${chalk.bold("MAX_COLLATERAL_RAITO_BPS:")} ${chalk.dim(res.MAX_COLLATERAL_RAITO_BPS)}
${chalk.bold("MAX_CID_SIZE:")} ${chalk.dim(res.MAX_CID_SIZE)}
${chalk.bold("MAX_DISK_USE:")} ${chalk.dim(res.MAX_DISK_USE)}
            `);
            const confirm = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "ok",
                    message: "confirm values (Y/n)",
                },
            ]);
            ok = confirm.ok;
            if (ok) {
                if (res.BYTE_PER_VESTING) utils.updateEnvFile("BYTE_PER_VESTING", res.BYTE_PER_VESTING);
                if (res.MAX_COLLATERAL_RAITO_BPS)
                    utils.updateEnvFile("MAX_COLLATERAL_RAITO_BPS", res.MAX_COLLATERAL_RAITO_BPS);
                if (res.MAX_CID_SIZE) utils.updateEnvFile("MAX_CID_SIZE", res.MAX_CID_SIZE);
                if (res.MAX_DISK_USE) utils.updateEnvFile("MAX_DISK_USE", res.MAX_DISK_USE);
            }
        }
    }
    const {ok} = await inquirer.prompt([
        {
            type: "confirm",
            name: "ok",
            message: "Ready to start? (Y/n)",
        },
    ]);
    return ok;
};

const main = async () => {
    let ok = false;

    while (!ok) {
        ok = await setup();
        if (ok) {
            try {
                console.clear();
                console.log(chalk.whiteBright.bold("Initializing Ethers"));
                eth = await initEthers();
                const balance = await eth.provider.getBalance(eth.wallet.address);
                const balanceWithDecimals = ethers.parseEther(balance.toString()).toString();
                console.log(`${chalk.white.bold("✅ Ethers Ready!")}
- ${chalk.bold("Provider:")} ${chalk.gray(CONSTANTS.PROVIDER_URL)}
- ${chalk.bold("Wallet address:")} ${chalk.gray(eth.wallet.address)} - Balance: ${chalk.gray(balanceWithDecimals)}
- ${chalk.bold("SFA address:")} ${chalk.gray(await eth.contracts.tokenERC20.getAddress())}
- ${chalk.bold("Market Contract address:")} ${chalk.gray(await eth.contracts.marketERC721.getAddress())}
                `);

                console.log(chalk.whiteBright.bold("Initializing Helia"));
                ipfs = await initHelia();
                const multiaddresses: Multiaddr[] = ipfs.node?.libp2p.getMultiaddrs();
                console.log(`${chalk.white.bold("✅ Helia Ready!")}
- ${chalk.bold("PeerId:")} ${chalk.gray(ipfs.node?.libp2p.peerId.toString())}
- ${chalk.bold("MultiAddress of your local IPFS Node:")} \n${chalk.gray(multiaddresses.join("\n"))}
                `);
            } catch (error) {
                console.error("Error initializing modules:", error);
                ok = false;
            }
        }
    }
    await menuOptions();
};

await main();
