import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, password, department, year } = body;

    // 1. Validation
    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "Full Name is required." }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    // 2. Database Connection
    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();

    // Enforce official Heritage Institute college domain restriction
    if (!normalizedEmail.endsWith("@heritageit.edu.in")) {
      return NextResponse.json(
        {
          error:
            "Access restricted: Only official Heritage Institute college email addresses (@heritageit.edu.in) are permitted to register.",
        },
        { status: 400 }
      );
    }

    // 3. Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in." },
        { status: 409 }
      );
    }

    // 4. Hash password with bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Create new User document in MongoDB
    const newUser = await User.create({
      name: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      department: department?.trim() || "General",
      year: year?.trim() || "1st Year",
      role: "student",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully! You can now sign in.",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          department: newUser.department,
          year: newUser.year,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration Error:", error);
    const message = error instanceof Error ? error.message : "Failed to create account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
