import { initiate_stk_push } from "../../tools/mpesa/transactions/initiate_stk_push";
import { STKPushRequest } from "../../types";

export default class MpesaAgentKit {

    async initiateStkPush(options: STKPushRequest) {
        return initiate_stk_push(options)
    }
}