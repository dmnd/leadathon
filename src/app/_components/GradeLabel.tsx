export function GradeLabel({
  grade,
  long = false,
}: {
  grade: number;
  long?: boolean;
}) {
  const ordinal =
    grade === 0
      ? ""
      : grade === 1
        ? "st"
        : grade === 2
          ? "nd"
          : grade === 3
            ? "rd"
            : "th";

  if (long) {
    if (grade === 0) {
      return <>Kindergarten</>;
    } else {
      return (
        <>
          {grade}
          <sup>{ordinal}</sup> Grade
        </>
      );
    }
  }

  return (
    <>
      {grade === 0 ? "K" : grade}
      <sup>{ordinal}</sup>
    </>
  );
}
