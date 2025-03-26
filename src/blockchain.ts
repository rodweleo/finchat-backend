

import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import * as dotenv from 'dotenv'
dotenv.config()

export const { NSEStockInvestmentContractAddress, HEDERA_TESTNET_RPC_URL, HEDERA_PRIVATE_KEY } = process.env

export const provider = new ethers.JsonRpcProvider(HEDERA_TESTNET_RPC_URL);
export const nseStockInvestmentContract = new ethers.Contract(NSEStockInvestmentContractAddress!, getContractAbi('NSEStockInvestment'), provider);

export function getContractAbi(contractName: string) {
    const filePath = path.join(__dirname, `./artifacts/contracts/${contractName}.sol/${contractName}.json`);
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return jsonData.abi;
}

