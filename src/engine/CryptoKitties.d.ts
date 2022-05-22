import { providers } from "ethers";
import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";
export declare class CryptoKitties extends Base {
    private _sender;
    private _recipient;
    private _kittyIds;
    private _cryptoKittiesContract;
    constructor(provider: providers.JsonRpcProvider, sender: string, recipient: string, kittyIds: number[]);
    description(): Promise<string>;
    getSponsoredTransactions(): Promise<Array<TransactionRequest>>;
}
