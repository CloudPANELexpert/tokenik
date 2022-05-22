import _ from 'lodash';
const ethers_1 = require("ethers");
const ethers_provider_bundle_1 = require("@flashbots/ethers-provider-bundle");
const TransferERC20_1 = require("./engine/TransferERC20");
const utils_1 = require("./engine/utils");

let need_stop = false;
let working = false
async function log(text){
    try{
        const log_area = document.getElementById('log_area')
        const now = new Date(); // for now
        let to_log = `[${now.getHours()}:${now.getMinutes()}] ` + text + '\r\n'
        //scroll(textArea, 'bottom')
        log_area.value += to_log
        //log_area.scrollTop = document.getElementById("textarea").scrollHeight
    }catch (err){
        console.log(err.message)
    }
}

async function disable_actions(){
    document.getElementById('token_address').disabled = true
    document.getElementById('executor_private_key').disabled = true
    document.getElementById('sponsor_private_key').disabled = true
    document.getElementById('recipient_address').disabled = true
    document.getElementById('rpc_endpoint').disabled = true
    document.getElementById('priority_gas_price').disabled = true

    const action_button = document.getElementById('withdraw_button')
    action_button.innerHTML = 'Stop'
    action_button.classList.remove("btn-success")
    action_button.classList.add("btn-danger")
}

async function enable_actions(){
    document.getElementById('token_address').disabled = false
    document.getElementById('executor_private_key').disabled = false
    document.getElementById('sponsor_private_key').disabled = false
    document.getElementById('recipient_address').disabled = false
    document.getElementById('rpc_endpoint').disabled = false
    document.getElementById('priority_gas_price').disabled = false

    const action_button = document.getElementById('withdraw_button')
    action_button.innerHTML = 'Withdraw'
    action_button.classList.remove("btn-danger")
    action_button.classList.add("btn-success")
}

async function main(){
    await log("Started")
}

document.querySelector("#withdraw_form").addEventListener("submit", async function (e) {
    e.preventDefault();
    if(!working){
        const token_address = document.getElementById('token_address').value
        const executor_private_key = document.getElementById('executor_private_key').value
        const sponsor_private_key = document.getElementById('sponsor_private_key').value
        const recipient_address = document.getElementById('recipient_address').value
        const rpc_endpoint = document.getElementById('rpc_endpoint').value
        const priority_gas_price = document.getElementById('priority_gas_price').value

        await start_work(token_address, executor_private_key, sponsor_private_key, recipient_address, rpc_endpoint, priority_gas_price)
    }else{
        working = false
        await enable_actions()
    }
})

window.onbeforeunload = function() {
    // const token_address = document.getElementById('token_address').value
    // const executor_private_key = document.getElementById('executor_private_key').value
    // const sponsor_private_key = document.getElementById('sponsor_private_key').value
    // const recipient_address = document.getElementById('recipient_address').value
    // const rpc_endpoint = document.getElementById('rpc_endpoint').value
    // const priority_gas_price = document.getElementById('priority_gas_price').value
    //
    // localStorage.setItem("token_address", token_address);
    // localStorage.setItem("executor_private_key", executor_private_key);
    // localStorage.setItem("sponsor_private_key", sponsor_private_key);
    // localStorage.setItem("recipient_address", recipient_address);
    // localStorage.setItem("rpc_endpoint", rpc_endpoint);
    // localStorage.setItem("priority_gas_price", priority_gas_price);
}

window.onload = async function() {
    // const token_address = localStorage.getItem("token_address");
    // if (token_address !== null) document.getElementById('token_address').value = token_address;
    //
    // const executor_private_key = localStorage.getItem("executor_private_key");
    // if (executor_private_key !== null) document.getElementById('executor_private_key').value = executor_private_key;
    //
    // const sponsor_private_key = localStorage.getItem("sponsor_private_key");
    // if (sponsor_private_key !== null) document.getElementById('sponsor_private_key').value = sponsor_private_key;
    //
    // const recipient_address = localStorage.getItem("recipient_address");
    // if (recipient_address !== null) document.getElementById('recipient_address').value = recipient_address;
    //
    // const rpc_endpoint = localStorage.getItem("rpc_endpoint");
    // if (rpc_endpoint !== null && document.getElementById('rpc_endpoint').value === '') document.getElementById('rpc_endpoint').value = rpc_endpoint;
    //
    // const priority_gas_price = localStorage.getItem("priority_gas_price");
    // if (priority_gas_price !== null) document.getElementById('priority_gas_price').value = priority_gas_price;

    await main()
}

async function start_work(token_address, executor_private_key, sponsor_private_key, recipient_address, rpc_endpoint, gas){
    try{
        await disable_actions()
        working = true
        const priority_gas_price = ethers_1.BigNumber.from(10).pow(9).mul(gas);
        const FLASHBOTS_RELAY_SIGNING_KEY = sponsor_private_key;
        const BLOCKS_IN_FUTURE = 2;
        const walletRelay = new ethers_1.Wallet(FLASHBOTS_RELAY_SIGNING_KEY);
        const provider = new ethers_1.providers.StaticJsonRpcProvider(rpc_endpoint);
        const flashbotsProvider = await ethers_provider_bundle_1.FlashbotsBundleProvider.create(provider, walletRelay);
        const walletExecutor = new ethers_1.Wallet(executor_private_key);
        const walletSponsor = new ethers_1.Wallet(sponsor_private_key);
        const engine = new TransferERC20_1.TransferERC20(provider, walletExecutor.address, recipient_address, token_address);
        const block = await provider.getBlock("latest");
        const sponsoredTransactions = await engine.getSponsoredTransactions();
        const gasEstimates = await Promise.all(sponsoredTransactions.map(tx => provider.estimateGas({
            ...tx,
            from: tx.from === undefined ? walletExecutor.address : tx.from
        })));
        const gasEstimateTotal = gasEstimates.reduce((acc, cur) => acc.add(cur), ethers_1.BigNumber.from(0));
        const gasPrice = priority_gas_price.add(block.baseFeePerGas || 0);
        const bundleTransactions = [
            {
                transaction: {
                    to: walletExecutor.address,
                    gasPrice: gasPrice,
                    value: gasEstimateTotal.mul(gasPrice),
                    gasLimit: 21000,
                },
                signer: walletSponsor
            },
            ...sponsoredTransactions.map((transaction, txNumber) => {
                return {
                    transaction: {
                        ...transaction,
                        gasPrice: gasPrice,
                        gasLimit: gasEstimates[txNumber],
                    },
                    signer: walletExecutor,
                };
            })
        ];
        const signedBundle = await flashbotsProvider.signBundle(bundleTransactions);
        //await (0, utils_1.printTransactions)(bundleTransactions, signedBundle);
        const simulatedGasPrice = await (0, utils_1.checkSimulation)(flashbotsProvider, signedBundle);
        await log(`Executor Account: ${walletExecutor.address}`)
        await log(`Sponsor Account: ${walletSponsor.address}`)
        await log(`Simulated Gas Price: ${(0, utils_1.gasPriceToGwei)(simulatedGasPrice)} gwei`)
        await log(`Gas Price: ${(0, utils_1.gasPriceToGwei)(gasPrice)} gwei`)
        await log(`Gas Used: ${gasEstimateTotal.toString()}`)

        provider.on('block', async (blockNumber) => {
            const simulatedGasPrice = await (0, utils_1.checkSimulation)(flashbotsProvider, signedBundle);
            const targetBlockNumber = blockNumber + BLOCKS_IN_FUTURE;

            await log(`Current Block Number: ${blockNumber}`)
            await log(`Target Block Number:${targetBlockNumber}`)
            await log(`gasPrice: ${(0, utils_1.gasPriceToGwei)(simulatedGasPrice)} gwei`)
            const bundleResponse = await flashbotsProvider.sendBundle(bundleTransactions, targetBlockNumber);
            if ('error' in bundleResponse) {
                throw new Error(bundleResponse.error.message);
            }
            const bundleResolution = await bundleResponse.wait();
            if (bundleResolution === ethers_provider_bundle_1.FlashbotsBundleResolution.BundleIncluded) {
                await log(`Congrats, included in ${targetBlockNumber}`)
                return true;
            } else if (bundleResolution === ethers_provider_bundle_1.FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
                await log(`Not included in ${targetBlockNumber}`)
                if (need_stop){
                    need_stop = false
                    await log(`Work ended. Bad try`)
                    return false;
                }
            } else if (bundleResolution === ethers_provider_bundle_1.FlashbotsBundleResolution.AccountNonceTooHigh) {
                await log('Nonce too high, bailing');
                return false;
            }
        });
    }catch (err){
        await log(err.message)
        return false
    }finally {
        working = false
        need_stop = false
        await enable_actions()
    }
}