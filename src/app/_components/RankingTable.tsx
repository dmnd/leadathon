"use client";

import Tippy from "./Tippy";
import clsx from "clsx/lite";
import PledgestarTippy from "./PledgestarTippy";
import { partition } from "~/array";

const highlightStyles =
  "bg-yellow-300/70 font-bold shadow-2xl text-shadow py-1";

export default function RankingTable({
  rows,
  minRows = rows.length,
}: {
  rows: Array<
    [
      number,
      {
        contents: React.ReactNode;
        scoreCell: React.ReactNode;
        key: string;
        score: number;
        highlight?: boolean;
      },
      boolean,
    ]
  >;
  minRows?: number;
}) {
  const [prizeRows, nonPrizeRows] = partition(rows, ([, , prize]) => prize);
  const n = Math.max(0, minRows - prizeRows.length);
  const fillerRows = nonPrizeRows.slice(0, n);
  const equalRankFillerRows =
    fillerRows.length === 0
      ? []
      : nonPrizeRows.slice(n).filter(([r]) => r === fillerRows.at(-1)![0]);
  const displayRows = [...prizeRows, ...fillerRows, ...equalRankFillerRows];

  return (
    <table className="w-full">
      <tbody>
        {displayRows.map(([rank, r, prize]) => (
          <tr className="whitespace-nowrap" key={r.key}>
            <td
              className={`w-12 select-none py-1 pr-1 text-right tabular-nums text-white ${r.highlight ? `rounded-l-md ${highlightStyles} text-opacity-100` : "text-opacity-30"}`}
            >
              {prize ? (
                <span
                  className={`relative inline-block h-6 w-6 rounded-full text-center ${r.highlight ? "bg-white/90" : "bg-white/45"}`}
                  style={{ mixBlendMode: "screen", color: "black" }}
                >
                  <span className="relative -top-0.5 text-xs font-bold">
                    <span className="text-[.6rem]">#</span>
                    {rank}
                  </span>
                </span>
              ) : (
                <span className="pr-1">
                  {r.score > 0 ? (
                    <>
                      <span className="text-xs">#</span>
                      {rank}
                    </>
                  ) : (
                    "-"
                  )}
                </span>
              )}
            </td>
            <td
              className={clsx(
                r.highlight && highlightStyles,
                r.score === 0 && "text-white/30",
              )}
            >
              {r.contents}
            </td>
            <td
              className={clsx(
                "text-right tabular-nums",
                r.highlight && highlightStyles,
                "rounded-r-md pr-2",
              )}
            >
              {r.score > 0 ? (
                r.scoreCell
              ) : (
                <Tippy
                  content={
                    <PledgestarTippy
                      initial={
                        <div>No reading logs found for {r.contents}.</div>
                      }
                    />
                  }
                  delay={0}
                  animation={false}
                  placement="bottom"
                  interactive={true}
                >
                  <span className="text-white/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="inline h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>{" "}
                    <span className="text-sm">no data</span>
                  </span>
                </Tippy>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
