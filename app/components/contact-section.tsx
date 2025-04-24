import { Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ContactSection() {
  return (
    <section className="py-16 bg-[#2a2a2a] relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,58,47,0.05)] to-[rgba(255,215,0,0.05)]"></div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Rajdhani',sans-serif] bg-gradient-to-r from-orange-500 to-yellow-400 text-transparent bg-clip-text">
            Ta steget - Kontakta oss
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Har du frågor eller behöver hjälp? Vi finns här för dig.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-lg p-6 flex items-center border border-gray-800 animate-fade-in contact-item">
              <div className="bg-[#252525] rounded-full p-3 mr-4">
                <Mail className="h-6 w-6 text-orange-500" />
              </div>
              <span>info@postboxen.se</span>
            </div>

            <div
              className="bg-[#1a1a1a] rounded-lg p-6 flex items-center border border-gray-800 animate-fade-in contact-item"
              style={{ animationDelay: "100ms" }}
            >
              <div className="bg-[#252525] rounded-full p-3 mr-4">
                <Phone className="h-6 w-6 text-orange-500" />
              </div>
              <span>070-123 45 67</span>
            </div>

            <div
              className="bg-[#1a1a1a] rounded-lg p-6 flex items-center border border-gray-800 animate-fade-in contact-item"
              style={{ animationDelay: "200ms" }}
            >
              <div className="bg-[#252525] rounded-full p-3 mr-4">
                <MapPin className="h-6 w-6 text-orange-500" />
              </div>
              <span>Göteborg, Sverige</span>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-8 border border-gray-800 hover:border-orange-500/30 transition-all duration-300 animate-fade-in">
            <form className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Ditt namn (din ninja-identitet)"
                  className="w-full bg-[#252525] border-0 focus:ring-orange-500 text-white rounded-md p-3"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Din e-post (för snabb kommunikation)"
                  className="w-full bg-[#252525] border-0 focus:ring-orange-500 text-white rounded-md p-3"
                />
              </div>
              <div>
                <textarea
                  placeholder="Beskriv din utmaning - vi hjälper dig att hitta vägen framåt"
                  className="w-full bg-[#252525] border-0 focus:ring-orange-500 text-white min-h-[150px] rounded-md p-3"
                ></textarea>
              </div>
              <div>
                <Button className="w-full py-6 bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 border-0 text-white font-medium rounded-full uppercase tracking-wide transform transition-transform hover:translate-y-[-2px] hover:shadow-lg gradient-button">
                  STARTA DIN RESA
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
