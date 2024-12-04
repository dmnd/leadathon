import Link from "next/link";

export default function PledgestarTippy({
  initial = null,
  ref,
}: {
  initial?: React.ReactNode;
  ref?: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="flex flex-col items-start gap-2 p-2 text-left" ref={ref}>
      {initial}
      <div>
        Log your reading on Pledgestar to be included in the next update!
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
  );
}
