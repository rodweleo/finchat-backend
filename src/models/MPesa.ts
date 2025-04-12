import axios from 'axios';
import { AccessTokenResponse, STKPushRequest, STKPushResponse } from '../types';


export class MPesa {
  private readonly baseUrl: string;
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly shortcode: string;
  private readonly passkey: string;
  private readonly callbackUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: {
    baseUrl: string;
    consumerKey: string;
    consumerSecret: string;
    shortcode: string;
    passkey: string;
    callbackUrl: string;
  }) {
    this.baseUrl = config.baseUrl;
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
    this.shortcode = config.shortcode;
    this.passkey = config.passkey;
    this.callbackUrl = config.callbackUrl;
  }

  /**
   * Generates and caches an access token
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get<AccessTokenResponse>(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      // Cache the token and set expiry (subtract 5 minutes for safety margin)
      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (parseInt(response.data.expires_in) - 300) * 1000);

      return this.accessToken;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to generate M-Pesa access token: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Initiates an STK Push transaction
   */
  async initiateSTKPush(
    amount: number,
    phoneNumber: string,
    accountReference: string,
    transactionDesc: string
  ): Promise<STKPushResponse> {
    try {
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const password = Buffer.from(
        `${this.shortcode}${this.passkey}${timestamp}`
      ).toString('base64');

      const requestData: STKPushRequest = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: this.shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
      };

      const accessToken = await this.getAccessToken();
      
      const response = await axios.post<STKPushResponse>(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`M-Pesa STK Push failed: ${error.response?.data?.errorMessage || error.message}`);
      }
      throw error;
    }
  }

  // Add more M-Pesa related methods here as needed
  // For example:
  // - initiateB2CPayment
  // - initiateB2BPayment
  // - checkTransactionStatus
  // - reverseTransaction
  // etc.
} 