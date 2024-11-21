"use client";

import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import PledgeIcon from "./PledgeIcon";

const highlightStyles =
  "bg-yellow-300/70 font-bold shadow-2xl text-shadow py-1";

export default function RankingTable({
  rows,
  showPledges = false,
}: {
  rows: Array<{
    contents: React.ReactNode;
    scoreCell: React.ReactNode;
    minutes: number;
    pledges: number;
    key: string;
    score: number;
    highlight?: boolean;
  }>;
  showPledges?: boolean;
}) {
  const rows2: Array<[number, (typeof rows)[0]]> = [];
  let rank = 1;
  let equalRank = 0;
  let lastScore = rows[0]!.score;
  for (const r of rows) {
    if (r.score < lastScore) {
      rank = rank + equalRank;
      equalRank = 1;
      lastScore = r.score;
    } else {
      equalRank = equalRank + 1;
    }
    rows2.push([rank, r]);
  }

  const rows3 = rows2.filter(([, r]) => !(r.score === 0 && r.pledges === 0));

  const maxPledges = Math.max(...rows.map((c) => c.pledges));

  return (
    <table className="w-full">
      <tbody>
        {rows3.map(([rank, r]) => (
          <tr className={"whitespace-nowrap"} key={r.key}>
            <td
              className={`w-12 select-none pr-2 text-right tabular-nums text-white text-opacity-30 ${r.highlight ? `rounded-l-md ${highlightStyles} text-opacity-100` : ""}`}
            >
              #{rank}
            </td>
            <td className={r.highlight ? highlightStyles : ""}>{r.contents}</td>
            <td
              className={`text-right tabular-nums ${r.highlight ? highlightStyles : ""} ${showPledges ? "" : "rounded-r-md"}`}
            >
              {r.scoreCell}
            </td>
            {showPledges ? (
              <td
                className={`w-10 pl-2 ${r.highlight ? `${highlightStyles} rounded-r-md` : ""}`}
              >
                {r.pledges >= maxPledges && (
                  <Tippy
                    content="Pledge leader"
                    delay={0}
                    animation={false}
                    placement="right"
                  >
                    <PledgeIcon />
                  </Tippy>
                )}
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
