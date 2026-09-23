import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Team from "@/models/Team";
import Event from "@/models/Event";
import { auth } from "@/auth";

/**
 * GET /api/profile
 * Retrieves authenticated student's profile details (including phone, roll, department, academic year).
 * Automatically backfills phone & roll from past team registrations if available.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase().trim();
    await connectDB();

    let user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Backfill phone and roll from existing teams if missing in User record
    if (!user.phone?.trim() || !user.roll?.trim()) {
      const pastTeam = await Team.findOne({
        $or: [{ leadEmail: email }, { "members.email": email }],
      }).sort({ createdAt: -1 });

      if (pastTeam) {
        let foundPhone = "";
        let foundRoll = "";

        if (pastTeam.leadEmail === email) {
          foundPhone = pastTeam.lead?.phone || "";
          foundRoll = pastTeam.lead?.roll || "";
        } else {
          const mem = pastTeam.members.find(
            (m: { email?: string; phone?: string; roll?: string }) =>
              m.email?.toLowerCase() === email
          );
          if (mem) {
            foundPhone = mem.phone || "";
            foundRoll = mem.roll || "";
          }
        }

        let needsSave = false;
        if (!user.phone?.trim() && foundPhone.trim()) {
          user.phone = foundPhone.trim();
          needsSave = true;
        }
        if (!user.roll?.trim() && foundRoll.trim()) {
          user.roll = foundRoll.trim();
          needsSave = true;
        }

        if (needsSave) {
          await user.save();
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image || "",
        department: user.department,
        year: user.year,
        phone: user.phone || "",
        roll: user.roll || "",
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile: " + (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Allows the student to edit and save their phone number and college roll number.
 * Propagates changes to active teams and registered teams for data consistency.
 */
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase().trim();
    const body = await req.json();
    const { phone, roll } = body;

    const cleanPhone = typeof phone === "string" ? phone.trim() : "";
    const cleanRoll = typeof roll === "string" ? roll.trim() : "";

    await connectDB();

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          phone: cleanPhone,
          roll: cleanRoll,
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Propagate phone and roll to all teams where user is lead
    await Team.updateMany(
      { leadEmail: email },
      {
        $set: {
          "lead.phone": cleanPhone,
          "lead.roll": cleanRoll,
        },
      }
    );

    // Propagate phone and roll to all teams where user is a member
    await Team.updateMany(
      { "members.email": email },
      {
        $set: {
          "members.$[elem].phone": cleanPhone,
          "members.$[elem].roll": cleanRoll,
        },
      },
      { arrayFilters: [{ "elem.email": email }] }
    );

    // Propagate to Event.registeredTeams if user is lead
    await Event.updateMany(
      { "registeredTeams.leadEmail": email },
      {
        $set: {
          "registeredTeams.$[t].leadPhone": cleanPhone,
        },
      },
      { arrayFilters: [{ "t.leadEmail": email }] }
    );

    return NextResponse.json({
      success: true,
      message: "Profile details updated successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image || "",
        department: user.department,
        year: user.year,
        phone: user.phone || "",
        roll: user.roll || "",
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile: " + (error as Error).message },
      { status: 500 }
    );
  }
}
