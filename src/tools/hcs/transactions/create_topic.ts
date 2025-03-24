import { Client, TopicCreateTransaction } from "@hashgraph/sdk";
import { CreateTopicResult } from "../../../types";

export const create_topic = async (
    memo: string,
    client: Client,
    isSubmitKey: boolean
): Promise<CreateTopicResult> => {
    let tx = new TopicCreateTransaction()
        .setTopicMemo(memo)
        .setAdminKey(client.operatorPublicKey!);

    if (isSubmitKey) {
        tx.setSubmitKey(client.operatorPublicKey!);
    }

    const txResponse = await tx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const txStatus = receipt.status;

    if (!txStatus.toString().includes('SUCCESS'))
        throw new Error("Topic creation transaction failed");

    if (!receipt.topicId)
        throw new Error("Unknown error occurred during topic creation.");


    return {
        txHash: txResponse.transactionId.toString(),
        status: txStatus.toString(),
        topicId: receipt.topicId.toString(),
    };
}