import { Brain, ChessKnight, Users, TrendingUp } from "lucide-react"

export function ServicesSection() {
  const services = [
    {
      icon: <ChessKnight className="h-12 w-12 text-orange-500" />,
      title: "Ledarskapsutbildning",
      description:
        "Som en ninja-mästare guidar sin lärling, utvecklar vi moderna och effektiva ledare genom skräddarsydda program som kombinerar praktisk träning med teoretisk förståelse.",
    },
    {
      icon: <Users className="h-12 w-12 text-orange-500" />,
      title: "Teamutveckling",
      description:
        "Precis som ett ninja-team arbetar i perfekt synk, hjälper vi er att stärka samarbetet och effektiviteten genom målmedveten utveckling och konkreta verktyg.",
    },
    {
      icon: <Brain className="h-12 w-12 text-orange-500" />,
      title: "Coaching",
      description:
        "Med individuell coaching hjälper vi dig att hitta din inre styrka och utveckla ditt personliga ledarskap. Som en ninja behärskar både kropp och sinne.",
    },
    {
      icon: <TrendingUp className="h-12 w-12 text-orange-500" />,
      title: "Organisationsutveckling",
      description:
        "Med precision och strategisk skicklighet utvecklar vi er organisation och kultur för långsiktig framgång. Som en ninja ser vi både detaljer och helhet.",
    },
  ]

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center font-['Rajdhani',sans-serif] bg-gradient-to-r from-orange-500 to-yellow-400 text-transparent bg-clip-text">
          Våra tjänster
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-[#1a1a1a] rounded-lg p-8 border border-gray-800 hover:border-orange-500/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="mb-6">{service.icon}</div>
              <h3 className="text-xl font-semibold text-orange-500 mb-4">{service.title}</h3>
              <p className="text-gray-300">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 