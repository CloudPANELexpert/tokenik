import { FlashbotsBundleProvider, FlashbotsBundleRawTransaction, FlashbotsBundleTransaction } from "@flashbots/ethers-provider-bundle";
import { BigNumber } from "ethers";
export declare const ETHER: BigNumber;
export declare const GWEI: BigNumber;
export declare function checkSimulation(flashbotsProvider: FlashbotsBundleProvider, signedBundle: Array<string>): Promise<BigNumber>;
export declare function printTransactions(bundleTransactions: Array<FlashbotsBundleTransaction | FlashbotsBundleRawTransaction>, signedBundle: Array<string>): Promise<void>;
export declare function gasPriceToGwei(gasPrice: BigNumber): number;
