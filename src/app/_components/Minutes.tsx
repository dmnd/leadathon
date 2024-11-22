export function Minutes({ minutes }: { minutes: number }) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return (
    <span>
      {hours > 0 ? (
        <>
          {hours.toString().padStart(2, "\u00A0")}
          <span className="text-sm">h</span>{" "}
        </>
      ) : null}
      {mins.toString().padStart(2, "0")}
      <span className="text-sm">m</span>
    </span>
  );
}
