import type { Ref } from "react";

export default function PledgeIcon({ ref }: { ref?: Ref<SVGSVGElement> }) {
  return (
    <svg
      ref={ref}
      className="inline-block -translate-y-0.5"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path
        d="M12 8c.8-.8 1.6-1.1 2.4-.6.8.5 1.1 1.4 0 2.2l-2.4 2.4-2.4-2.4c-1.1-.8-.8-1.7 0-2.2.8-.5 1.6-.2 2.4.6z"
        fill="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
