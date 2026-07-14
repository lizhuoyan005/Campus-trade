export function GoodsCardSkeleton() {
  return (
    <div className="block bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="h-32 skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-16 skeleton" />
        <div className="h-4 w-full skeleton" />
        <div className="h-5 w-20 skeleton" />
        <div className="h-3 w-24 skeleton" />
      </div>
    </div>
  );
}

export function GoodsDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="h-8 w-64 skeleton" />
      <div className="h-64 skeleton" />
      <div className="h-4 w-full skeleton" />
      <div className="h-4 w-3/4 skeleton" />
      <div className="h-10 w-32 skeleton" />
    </div>
  );
}