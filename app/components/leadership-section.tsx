export function LeadershipSection() {
  return (
    <section className="relative py-24">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,0,0,0.8)] to-[#121212]"></div>
        <div className="absolute inset-0 bg-[url('/forest-dark.jpg')] bg-cover bg-center opacity-30"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-red-500">Ledarskap</h2>
          <p className="text-xl text-gray-300 mb-8">
            Ledarskap är att ha inflytande och att påverka. För att åstadkomma detta krävs att du ges det privilegiet, dvs. någon ger dig
            tillåtelsen att leda dem genom att välja att följa dig.
          </p>
          <p className="text-xl text-gray-300 italic">
            Oavsett om du har en ledarroll idag eller aspirerar på en i framtiden: varför ska någon låta sig ledas av dig?
          </p>
        </div>
      </div>

      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400"></div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400"></div>
    </section>
  )
} 