import { Zap } from "lucide-react"

export function MethodSection() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center font-['Rajdhani',sans-serif] bg-gradient-to-r from-orange-500 to-yellow-400 text-transparent bg-clip-text">
          Vår Metod - Ninja-vägen till framgångsrikt ledarskap
        </h2>
        
        <div className="text-gray-300 text-lg mb-12 max-w-4xl mx-auto">
          <p>
            Precis som en ninja behärskar olika tekniker och anpassar sig efter situationen, bygger vår metodik på en unik kombination av modern
            psykologi och beprövad visdom. Vi utgår från tre grundprinciper:
          </p>
        </div>

        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="flex items-start gap-4 p-6 rounded-lg bg-[#1a1a1a] border border-gray-800 hover:border-orange-500/50 transition-all duration-300">
            <Zap className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-orange-500 mb-2">Vetenskapens skärpa</h3>
              <p className="text-gray-300">Som ett välslipat svärd är våra metoder förankrade i aktuell forskning inom psykologi och ledarskap</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-lg bg-[#1a1a1a] border border-gray-800 hover:border-orange-500/50 transition-all duration-300">
            <Zap className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-orange-500 mb-2">Praktikens kraft</h3>
              <p className="text-gray-300">Likt en ninja tränar vi genom verkliga utmaningar med konkreta verktyg som ger resultat i vardagen</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-lg bg-[#1a1a1a] border border-gray-800 hover:border-orange-500/50 transition-all duration-300">
            <Zap className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-orange-500 mb-2">Anpassningens konst</h3>
              <p className="text-gray-300">Varje organisation är unik, därför skräddarsyr vi alltid våra insatser med precision och fingertoppskänsla</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-300 text-lg max-w-4xl mx-auto">
          <p>
            Vi tror på att kombinera det bästa från två världar - modern vetenskap och tidlös visdom. Som en ninja använder vi både traditionella och
            moderna verktyg för att nå målet.
          </p>
        </div>
      </div>
    </section>
  )
} 