"use client";

import Tippy from "./Tippy";
import PledgestarTippy from "./PledgestarTippy";

export default function Footer({ lastUpdate }: { lastUpdate: string }) {
  return (
    <div className="pt-5 text-sm text-white/50">
      Pledgestar data last updated {lastUpdate}.{" "}
      <Tippy
        content={<PledgestarTippy />}
        delay={0}
        animation={false}
        placement="bottom"
        interactive={true}
      >
        <span className="underline decoration-dotted">Something missing?</span>
      </Tippy>
    </div>
  );
}
