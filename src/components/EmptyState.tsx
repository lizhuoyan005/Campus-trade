export default function EmptyState({ message, suggestion }: { message: string; suggestion?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <span className="text-5xl mb-4">📭</span>
      <p className="text-lg font-medium text-gray-500">{message}</p>
      {suggestion && <p className="text-sm mt-1">{suggestion}</p>}
    </div>
  );
}