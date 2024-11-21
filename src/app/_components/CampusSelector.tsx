"use client";
import { useRouter } from "next/navigation";
import { campuses } from "../../types";

export default function CampusSelector({ campus }: { campus: string }) {
  const router = useRouter();

  return (
    <select
      className="rounded bg-white/10 p-2 text-lg"
      value={campus}
      onChange={(e) => {
        router.push(`/${e.target.value.toLowerCase()}`);
      }}
    >
      <option value="CAR">{campuses.CAR}</option>
      <option value="CHE">{campuses.CHE}</option>
      <option value="MLK">{campuses.MLK}</option>
    </select>
  );
}
