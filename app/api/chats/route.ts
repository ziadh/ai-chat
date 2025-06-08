import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Chat from "@/lib/models/Chat";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error - User type is not defined in the session
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await connectToDatabase();

    // @ts-expect-error - User type is not defined in the session
    const chats = await Chat.find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .lean();

    return Response.json(chats);
  } catch (error) {
    console.error("Get chats error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error - User type is not defined in the session
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { title, provider, modelName } = await req.json();

    await connectToDatabase();

    const chat = await Chat.create({
      title,
      // @ts-expect-error - User type is not defined in the session
      userId: session.user.id,
      provider,
      modelName,
    });

    return Response.json(chat);
  } catch (error) {
    console.error("Create chat error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
