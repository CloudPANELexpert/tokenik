"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Approval721 = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const Base_1 = require("./Base");
const ERC721_ABI = [{
        "constant": true,
        "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            }],
        "name": "isApprovedForAll",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }, {
        "constant": false,
        "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, {
                "internalType": "bool",
                "name": "approved",
                "type": "bool"
            }],
        "name": "setApprovalForAll",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, {
                "internalType": "address",
                "name": "to",
                "type": "address"
            }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, {
                "internalType": "address",
                "name": "to",
                "type": "address"
            }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
        "name": "transferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }];
class Approval721 extends Base_1.Base {
    constructor(recipient, contractAddresses721) {
        super();
        if (!(0, utils_1.isAddress)(recipient))
            throw new Error("Bad Address");
        this._recipient = recipient;
        this._contractAddresses721 = contractAddresses721;
    }
    async description() {
        return `Giving ${this._recipient} approval for: ${this._contractAddresses721.join(", ")}`;
    }
    getSponsoredTransactions() {
        return Promise.all(this._contractAddresses721.map(async (contractAddress721) => {
            const erc721Contract = new ethers_1.Contract(contractAddress721, ERC721_ABI);
            return {
                ...(await erc721Contract.populateTransaction.setApprovalForAll(this._recipient, true)),
                gasPrice: ethers_1.BigNumber.from(0),
            };
        }));
    }
}
exports.Approval721 = Approval721;
//# sourceMappingURL=Approval721.js.map