import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { isAuthorizedAdmin } from "@/lib/admin-check";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

// GET: Fetch all registered student participants
export async function GET(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    await connectDB();
    const students = await User.find(
      {},
      { password: 0 } // exclude password hash
    ).sort({ createdAt: -1 });

    return NextResponse.json({ participants: students }, { status: 200 });
  } catch (error: unknown) {
    console.error("Admin GET participants error:", error);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }
}
