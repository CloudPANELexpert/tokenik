import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";
export declare class Approval721 extends Base {
    private _recipient;
    private _contractAddresses721;
    constructor(recipient: string, contractAddresses721: string[]);
    description(): Promise<string>;
    getSponsoredTransactions(): Promise<Array<TransactionRequest>>;
}
