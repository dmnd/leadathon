export default function Footer({ lastUpdate }: { lastUpdate: Date }) {
  return (
    <div className="text-sm text-white/50">
      Data updated {lastUpdate.toLocaleString()}
    </div>
  );
}
