import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Chat from "@/lib/models/Chat";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error - User type is not defined in the session
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await connectToDatabase();

    const chat = await Chat.findOne({
      _id: params.id,
      // @ts-expect-error - User type is not defined in the session
      userId: session.user.id,
    }).lean();

    if (!chat) {
      return new Response("Chat not found", { status: 404 });
    }

    return Response.json(chat);
  } catch (error) {
    console.error("Get chat error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error - User type is not defined in the session
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await connectToDatabase();

    await Chat.deleteOne({
      _id: params.id,
      // @ts-expect-error - User type is not defined in the session
      userId: session.user.id,
    });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    console.error("Delete chat error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
