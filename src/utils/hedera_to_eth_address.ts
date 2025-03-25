
import { keccak256 } from "ethers";

/**
 * Converts a Hedera public key to an Ethereum-compatible 0x address
 * @param {string} hederaPublicKey - The Hedera public key in hex format
 * @returns {string} - Ethereum-style 0x address
 */
export function hedera_to_eth_address(hederaPublicKey: string) {
    // Remove the first 24 characters of the public key (prefix)
    let cleanPublicKey = hederaPublicKey.slice(-64);

    // Convert to Buffer for hashing
    let publicKeyBuffer = Buffer.from(cleanPublicKey, "hex");

    // Hash with Keccak-256
    let hash = keccak256(publicKeyBuffer);

    // Take the last 20 bytes (40 hex characters) and prepend "0x"
    return "0x" + hash.slice(-40);
}
