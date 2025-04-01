import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MemorySaver } from "@langchain/langgraph";
import HederaAgentKit from "../agent";
import { createHederaTools } from "../langchain";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

export const initializeAgent = () => {
    try {
        const llm = new ChatGoogleGenerativeAI({
            modelName: "gemini-1.5-flash",
            maxOutputTokens: 2048,
            apiKey: process.env.GOOGLE_GEMINI_API_KEY!
        });

        // Initialize HederaAgentKit
        const hederaKit = new HederaAgentKit(
            process.env.HEDERA_OPERATOR_ACCOUNT_ID!,
            process.env.HEDERA_OPERATOR_PRIVATE_KEY!,
            // Pass your network of choice. Default is "mainnet".
            // You can specify 'testnet', 'previewnet', or 'mainnet'.
            process.env.HEDERA_NETWORK as "mainnet" | "testnet" | "previewnet" || "testnet"
        );

        // Create the LangChain-compatible tools
        const tools = createHederaTools(hederaKit);

        // Prepare an in-memory checkpoint saver
        const memory = new MemorySaver();

        // Additional configuration for the agent
        const config = { configurable: { thread_id: "Hedera Agent Kit!" } };

        // Create the React agent
        const agent = createReactAgent({
            llm,
            tools,
            checkpointSaver: memory,
            // You can adjust this message for your scenario:
            messageModifier: `
        You are a helpful agent that can interact on-chain using the Hedera Agent Kit. 
        You are empowered to interact on-chain using your tools. If you ever need funds,
        you can request them from a faucet or from the user. 
        If there is a 5XX (internal) HTTP error code, ask the user to try again later. 
        If someone asks you to do something you can't do with your available tools, you 
        must say so, and encourage them to implement it themselves with the Hedera Agent Kit. 
        Keep your responses concise and helpful.
      `,
        });

        return { agent, config };
    } catch (error) {
        console.error("Failed to initialize agent:", error);
        throw error;
    }
}