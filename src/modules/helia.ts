import {createHelia} from "helia";
import {unixfs} from "@helia/unixfs";
import {Libp2pOptions} from "../config/libp2p.ts";
import {createLibp2p} from "libp2p";

export default async function initHelia() {
    const libp2p = await createLibp2p(Libp2pOptions);
    const node = await createHelia({libp2p});
    const fs = unixfs(node);
    return {node, fs};
}
