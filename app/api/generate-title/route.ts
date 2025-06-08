import { generateText } from "ai";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { providers } from "@/lib/providers";

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error - User type is not defined in the session
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response("No messages provided", { status: 400 });
    }

    // Use OpenAI's GPT-4o mini for title generation
    const openaiProvider = providers.openai;
    const aiModel = openaiProvider.getModel("gpt-4o-mini");

    // Create a context-aware prompt for title generation
    const conversationContext = messages
      .slice(0, 4) // Use first 4 messages for context
      .map((msg: { role: string; content: string }) => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      )
      .join('\n');

    const titlePrompt = `Based on this conversation, generate a concise, descriptive title (maximum 6 words). The title should capture the main topic or question being discussed. Respond with ONLY the title, no quotes, no explanations.

Conversation:
${conversationContext}`;

    const result = await generateText({
      model: aiModel,
      prompt: titlePrompt,
      maxTokens: 20,
      temperature: 0.3, // Lower temperature for more consistent titles
    });

    // Clean and validate the generated title
    let title = result.text.trim();
    
    // Remove quotes if present
    title = title.replace(/^["']|["']$/g, '');
    
    // Limit to 50 characters max
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    // Fallback if title is empty or too short
    if (!title || title.length < 3) {
      const firstUserMessage = messages.find((msg: { role: string; content: string }) => msg.role === 'user')?.content || '';
      title = firstUserMessage.length > 50 
        ? firstUserMessage.substring(0, 47) + '...'
        : firstUserMessage || 'New Chat';
    }

    return Response.json({ title });
  } catch (error) {
    console.error("Title generation error:", error);
    
    // Fallback to first user message if AI generation fails
    try {
      const { messages } = await req.json();
      const firstUserMessage = messages.find((msg: { role: string; content: string }) => msg.role === 'user')?.content || '';
      const fallbackTitle = firstUserMessage.length > 50 
        ? firstUserMessage.substring(0, 47) + '...'
        : firstUserMessage || 'New Chat';
        
      return Response.json({ title: fallbackTitle });
    } catch {
      return Response.json({ title: 'New Chat' });
    }
  }
} 