export default function Discover() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-red-500">
      <div className="flex flex-col w-2/3 h-full bg-green-500">
        <div className="items-center justify-center w-full h-2/9 bg-blue-500">
          <div className="p-4 bg-yellow-500 w-full h-2/3">discover description</div>
          <div className="p-4 bg-purple-500 w-full h-1/3">search N Filter</div>
        </div>
        <div className="flex-1 bg-orange-500">
          <div className="p-4 bg-pink-500 w-full h-1/10">crypto card</div>
          <div className="p-4 bg-gray-500 w-full h-1/10">crypto card</div>
          <div className="p-4 bg-indigo-500 w-full h-1/10">crypto card</div>
        </div>
      </div>
    </div>
  );
}