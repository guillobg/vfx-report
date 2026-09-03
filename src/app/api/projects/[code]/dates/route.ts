import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getProjectByCode,
  getProjectVfxDates,
  getProjectKeyDates,
} from "@/lib/airtable";

// Returns the project-level dates the Calendar section reads/edits:
// - vfxCalendar: VFX Start / VFX Deadline rows from PMC DATES (grouped by episode)
// - keyDates: rows from KEY DATES
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { code } = await params;
    const project = await getProjectByCode(code);
    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    const [vfxCalendar, keyDates] = await Promise.all([
      getProjectVfxDates(project.code),
      getProjectKeyDates(project.code),
    ]);

    return NextResponse.json({ vfxCalendar, keyDates });
  } catch (error) {
    console.error("Error fetching project dates:", error);
    return NextResponse.json(
      { error: "Error al obtener las fechas del proyecto" },
      { status: 500 }
    );
  }
}
