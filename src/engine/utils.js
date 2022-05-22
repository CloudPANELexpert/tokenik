"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gasPriceToGwei = exports.printTransactions = exports.checkSimulation = exports.GWEI = exports.ETHER = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
exports.ETHER = ethers_1.BigNumber.from(10).pow(18);
exports.GWEI = ethers_1.BigNumber.from(10).pow(9);
async function checkSimulation(flashbotsProvider, signedBundle) {
    const simulationResponse = await flashbotsProvider.simulate(signedBundle, "latest");
    if ("results" in simulationResponse) {
        for (let i = 0; i < simulationResponse.results.length; i++) {
            const txSimulation = simulationResponse.results[i];
            if ("error" in txSimulation) {
                throw new Error(`TX #${i} : ${txSimulation.error} ${txSimulation.revert}`);
            }
        }
        if (simulationResponse.coinbaseDiff.eq(0)) {
            throw new Error("Does not pay coinbase");
        }
        const gasUsed = simulationResponse.results.reduce((acc, txSimulation) => acc + txSimulation.gasUsed, 0);
        const gasPrice = simulationResponse.coinbaseDiff.div(gasUsed);
        return gasPrice;
    }
    console.error(`Similuation failed, error code: ${simulationResponse.error.code}`);
    console.error(simulationResponse.error.message);
    throw new Error("Failed to simulate response");
}
exports.checkSimulation = checkSimulation;
async function printTransactions(bundleTransactions, signedBundle) {
    console.log("--------------------------------");
    console.log((await Promise.all(bundleTransactions.map(async (bundleTx, index) => {
        const tx = 'signedTransaction' in bundleTx ? (0, utils_1.parseTransaction)(bundleTx.signedTransaction) : bundleTx.transaction;
        const from = 'signer' in bundleTx ? await bundleTx.signer.getAddress() : tx.from;
        return `TX #${index}: ${from} => ${tx.to} : ${tx.data}`;
    }))).join("\n"));
    console.log("--------------------------------");
    console.log((await Promise.all(signedBundle.map(async (signedTx, index) => `TX #${index}: ${signedTx}`))).join("\n"));
    console.log("--------------------------------");
}
exports.printTransactions = printTransactions;
function gasPriceToGwei(gasPrice) {
    return gasPrice.mul(100).div(exports.GWEI).toNumber() / 100;
}
exports.gasPriceToGwei = gasPriceToGwei;
//# sourceMappingURL=utils.js.map