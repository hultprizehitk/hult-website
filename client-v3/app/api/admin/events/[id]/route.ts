import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { isAuthorizedAdmin, isAuthorizedSuperAdmin } from "@/lib/admin-check";
import { logAdminAction } from "@/lib/audit-logger";
import { auth } from "@/auth";
import Event from "@/models/Event";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const isAuth = await isAuthorizedAdmin(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const event = await Event.findById(id).lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Admin event GET ID error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const isAuth = await isAuthorizedAdmin(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const session = await auth();
    const body = await req.json();

    await connectDB();

    const existing = await Event.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const updatableFields = [
      "title",
      "tag",
      "date",
      "startDate",
      "endDate",
      "venue",
      "description",
      "link",
      "isPublished",
      "order",
      "registrationStatus",
      "registrationDeadline",
      "maxTeams",
      "minTeamMembers",
      "maxTeamMembers",
      "checkinEnabled",
    ];

    // Master admin-only guard for checkinEnabled toggle
    if (body.checkinEnabled !== undefined) {
      const isSuperAdmin = await isAuthorizedSuperAdmin(req);
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "Only Master Admin can toggle check-in status for events." },
          { status: 403 }
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (existing as any)[field] = body[field];
        updateData[field] = body[field];
      }
    }

    await existing.save();

    // Direct MongoDB persistence to guarantee fields like checkinEnabled are updated in Atlas
    if (Object.keys(updateData).length > 0) {
      await Event.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateData }
      );
    }

    await logAdminAction({
      adminEmail: session?.user?.email || "admin",
      adminName: session?.user?.name || "Admin",
      adminRole: (session?.user as { role?: string })?.role || "admin",
      action: `Updated event: "${existing.title}"`,
      targetType: "event",
      targetId: id,
      details: { updatedFields: Object.keys(body) },
      req,
    });

    return NextResponse.json({ success: true, event: existing });
  } catch (error) {
    console.error("Admin event PUT error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const isAuth = await isAuthorizedAdmin(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const session = await auth();
    await connectDB();

    const existing = await Event.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventTitle = existing.title;
    await Event.findByIdAndDelete(id);

    await logAdminAction({
      adminEmail: session?.user?.email || "admin",
      adminName: session?.user?.name || "Admin",
      adminRole: (session?.user as { role?: string })?.role || "admin",
      action: `Deleted event: "${eventTitle}"`,
      targetType: "event",
      targetId: id,
      details: { title: eventTitle },
      req,
    });

    return NextResponse.json({ success: true, message: "Event removed successfully" });
  } catch (error) {
    console.error("Admin event DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
