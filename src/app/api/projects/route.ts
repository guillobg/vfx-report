import { NextResponse } from "next/server";
import { getActiveProjects } from "@/lib/airtable";

export async function GET() {
  try {
    const projects = await getActiveProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Error al obtener los proyectos" },
      { status: 500 }
    );
  }
}
