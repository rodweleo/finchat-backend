
import axios from "axios"

export const evmAddress_to_hederaId = async (evmAddress: `0x${string}`): Promise<string | null> => {
    const response = await axios.get(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${evmAddress}`);
    return response.data.account
}