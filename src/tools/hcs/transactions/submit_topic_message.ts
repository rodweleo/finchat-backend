import { Client, TopicId, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { SubmitMessageResult } from "../../../types";

export const submit_topic_message = async (
    topicId: TopicId,
    message: string,
    client: Client
): Promise<SubmitMessageResult> => {
    const tx = await new TopicMessageSubmitTransaction({
        topicId: topicId,
        message: message,
    }).execute(client);

    const receiptQuery = tx.getReceiptQuery();
    const txResponse = await receiptQuery.execute(client);
    const receipt = txResponse.status;
    const hash = receiptQuery.transactionId?.toString();
    return {
        status: receipt.toString(),
        txHash: hash || 'error',
    }
}
