import {tcp} from "@libp2p/tcp";
import {identify} from "@libp2p/identify";
import {gossipsub} from "@chainsafe/libp2p-gossipsub";
import {noise} from "@chainsafe/libp2p-noise";
import {yamux} from "@chainsafe/libp2p-yamux";
import {mdns} from "@libp2p/mdns";
import {webSockets} from "@libp2p/websockets";
import * as filters from "@libp2p/websockets/filters";
import {circuitRelayServer} from "@libp2p/circuit-relay-v2";
import {MemoryDatastore} from "datastore-core";

const datastore = new MemoryDatastore();

export const Libp2pOptions = {
    datastore,
    peerDiscovery: [mdns()],
    addresses: {
        listen: ["/ip4/0.0.0.0/tcp/4001", "/ip4/0.0.0.0/tcp/4004/ws"],
    },
    transports: [
        tcp(),
        webSockets({
            filter: filters.all,
        }),
    ],
    connectionEncryption: [noise()],
    streamMuxers: [yamux()],
    services: {
        identify: identify(),
        pubsub: gossipsub({allowPublishToZeroPeers: true}),
        relay: circuitRelayServer(),
    },
};
