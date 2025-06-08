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

    const result = streamText({
      model: aiModel,
      messages,
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
    return new Response("Internal Server Error", { status: 500 });
  }
}
