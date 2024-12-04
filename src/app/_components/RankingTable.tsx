"use client";

import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import PledgeIcon from "./PledgeIcon";
import { pluralize } from "~/string";
import clsx from "clsx/lite";
import Link from "next/link";

const highlightStyles =
  "bg-yellow-300/70 font-bold shadow-2xl text-shadow py-1";

export default function RankingTable({
  rows,
  showPledges = false,
  awards,
}: {
  rows: Array<{
    contents: React.ReactNode;
    scoreCell: React.ReactNode;
    pledges: number;
    key: string;
    score: number;
    highlight?: boolean;
  }>;
  showPledges?: boolean;
  awards: number;
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

  const maxPledges = Math.max(...rows.map((c) => c.pledges));

  return (
    <table className="w-full">
      <tbody>
        {rows2.map(([rank, r]) => (
          <tr className="whitespace-nowrap" key={r.key}>
            <td
              className={`w-12 select-none py-1 pr-1 text-right tabular-nums text-white ${r.highlight ? `rounded-l-md ${highlightStyles} text-opacity-100` : "text-opacity-30"}`}
            >
              {r.score > 0 && rank <= awards ? (
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
                !showPledges && "rounded-r-md",
              )}
            >
              {r.score > 0 ? (
                r.scoreCell
              ) : (
                <Tippy
                  content={
                    <div className="flex flex-col items-start gap-2 p-2 text-left">
                      <div>No reading logs found for {r.contents}.</div>
                      <div>
                        Log your reading on Pledgestar to be included in the
                        next update!
                      </div>
                      <div>
                        See{" "}
                        <Link
                          href="https://youtu.be/OSpLaG7jeps?t=58"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-500 underline hover:text-yellow-700"
                        >
                          this video
                        </Link>{" "}
                        for instructions.
                      </div>
                      <Link
                        href="https://pledgestar.com/yuming/"
                        className="mt-2 inline-block rounded bg-yellow-500 px-4 py-2 font-bold text-black hover:bg-yellow-700"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Go to Pledgestar
                      </Link>
                    </div>
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
            {showPledges ? (
              <td
                className={clsx(
                  "w-10 pl-2",
                  r.highlight && `${highlightStyles} rounded-r-md`,
                )}
              >
                {r.pledges >= maxPledges && (
                  <Tippy
                    content={`Pledge leader (${r.pledges} ${pluralize("pledge", r.pledges)})`}
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
