import { NextResponse } from "next/server";
import { exportCSV } from "../../../../data";
import { campuses, type Campus } from "../../../../types";
import { notFound } from "next/navigation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ campus: string }> },
) {
  const campus = (await params).campus.toUpperCase() as Campus;
  if (!(campus in campuses)) {
    return notFound();
  }

  const csv = await exportCSV(campus);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="prizes.csv"',
    },
  });
}
