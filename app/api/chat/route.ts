import { streamText } from "ai";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Chat from "@/lib/models/Chat";
import { providers, type ProviderKey } from "@/lib/providers";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error - User type is not defined in the session
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, chatId, provider, model } = await req.json();

    // Validate provider and model
    if (!providers[provider as ProviderKey]) {
      return new Response("Invalid provider", { status: 400 });
    }

    const selectedProvider = providers[provider as ProviderKey];
    const aiModel = selectedProvider.getModel(model);

    await connectToDatabase();

    // Update chat with new message
    if (chatId) {
      await Chat.findByIdAndUpdate(chatId, {
        $push: {
          messages: {
            role: "user",
            content: messages[messages.length - 1].content,
          },
        },
      });
    }

    // Add system prompt to guide the AI's behavior
    const systemPrompt = {
      role: "system",
      content: "You are an intelligent AI model for Atlas AI, designed to be helpful, knowledgeable, and supportive to users. Please format all your responses using proper HTML syntax with appropriate tags like <p>, <h1>-<h6>, <ul>, <ol>, <li>, <strong>, <em>, <code>, <pre>, etc. Make your responses well-structured and readable."
    };

    // Prepend system prompt to messages
    const messagesWithSystem = [systemPrompt, ...messages];

    const result = streamText({
      model: aiModel,
      messages: messagesWithSystem,
      onFinish: async (result) => {
        if (chatId) {
          // Save assistant response
          await Chat.findByIdAndUpdate(chatId, {
            $push: {
              messages: {
                role: "assistant",
                content: result.text,
              },
            },
          });
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    // Return more detailed error information for debugging
    return new Response(
      JSON.stringify({ 
        error: "Internal Server Error", 
        details: error instanceof Error ? error.message : String(error) 
      }), 
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}
