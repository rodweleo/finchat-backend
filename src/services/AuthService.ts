
import axios from "axios"

export const generateMpesaAccessToken = async () => {
    const consumerKey = process.env.MPESA_SANBOX_CONSUMER_KEY!;
    const consumerSecret = process.env.MPESA_SANDBOX_CONSUMER_SECRET!;

    const res = await axios.get(`${process.env.MPESA_SANDBOX_BASE_URL!}/oauth/v1/generate`, {
        headers: {
            "Authorization": `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`
        },
        params: {
            "grant_type": "client_credentials"
        }
    })

    return res.data;
}