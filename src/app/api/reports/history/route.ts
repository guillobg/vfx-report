import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getReportsForUser, getAllReports } from "@/lib/airtable";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let reports;
    if (session.user.role === "admin") {
      reports = await getAllReports();
    } else {
      reports = await getReportsForUser(session.user.email);
    }

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Error al obtener los informes" },
      { status: 500 }
    );
  }
}
