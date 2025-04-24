export default function PostboxenLogo() {
  return (
    <div className="flex items-center">
      <div className="mr-2 relative w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-400 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0.5 bg-black rounded-md"></div>
        <div className="relative z-10 text-white font-bold text-xl font-['Rajdhani',sans-serif]">P</div>
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-yellow-400 text-transparent bg-clip-text font-['Rajdhani',sans-serif]">
        Postboxen
      </span>
    </div>
  )
}
