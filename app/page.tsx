"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, Loader2, Video, ImageIcon, Linkedin, Play } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import PostboxenLogo from "./components/postboxen-logo"
import { Hamburger } from "@/components/ui/hamburger"
import { MethodSection } from "./components/method-section"
import { ServicesSection } from "./components/services-section"
import { ContactSection } from "./components/contact-section"
import { LeadershipSection } from "./components/leadership-section"

interface PricingPlan {
  title: string
  price: string
  period: string
  buttonText: string
  popular: boolean
  features: string[]
  savings?: string
}

export default function PostboxenVideoGenerator() {
  const [script, setScript] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState("avatar1")
  const [generationStatus, setGenerationStatus] = useState("")
  const [activeTab, setActiveTab] = useState("generator")
  const [navbarBackground, setNavbarBackground] = useState("rgba(18, 18, 18, 0.95)")
  const [navbarTransform, setNavbarTransform] = useState("translateY(0)")
  const [selectedVoice, setSelectedVoice] = useState("voice1")

  const avatars = [
    { id: "avatar1", name: "Anna", image: "/placeholder.svg?height=80&width=80" },
    { id: "avatar2", name: "Erik", image: "/placeholder.svg?height=80&width=80" },
    { id: "avatar3", name: "Maria", image: "/placeholder.svg?height=80&width=80" },
    { id: "avatar4", name: "Johan", image: "/placeholder.svg?height=80&width=80" },
  ]

  const services = [
    {
      icon: <Video className="h-8 w-8 text-orange-500" />,
      title: "Videoannons",
      description:
        "Skapa professionella videoklipp för dina annonser på sociala medier och webben med AI-genererade presentatörer.",
    },
    {
      icon: <Linkedin className="h-8 w-8 text-orange-500" />,
      title: "LinkedIn-inlägg",
      description:
        "Generera engagerande videoinlägg optimerade för LinkedIn och professionella nätverk som ökar din synlighet.",
    },
    {
      icon: <ImageIcon className="h-8 w-8 text-orange-500" />,
      title: "Produktdemonstrationer",
      description:
        "Visa upp dina produkter med övertygande presentationer från virtuella presentatörer som skapar intresse.",
    },
    {
      icon: <Play className="h-8 w-8 text-orange-500" />,
      title: "Utbildningsvideos",
      description:
        "Skapa pedagogiska videor för kurser, utbildningar och interna presentationer som engagerar din målgrupp.",
    },
  ]

  const testimonials = [
    {
      name: "Sofia Bergström",
      company: "Marketingbyrån AB",
      image: "/placeholder.svg?height=60&width=60",
      quote:
        "Postboxen har revolutionerat vårt sätt att skapa innehåll. Vi sparar timmar varje vecka och kvaliteten är fantastisk.",
    },
    {
      name: "Anders Lindqvist",
      company: "Tech Solutions",
      image: "/placeholder.svg?height=60&width=60",
      quote:
        "Vi använder Postboxen för alla våra produktdemonstrationer. Kunderna kan inte tro att det är AI-genererat innehåll!",
    },
    {
      name: "Maria Johansson",
      company: "E-handelsbutiken",
      image: "/placeholder.svg?height=60&width=60",
      quote:
        "Sedan vi började använda Postboxen har vår konverteringsgrad ökat med 35%. Bästa investeringen vi gjort i år.",
    },
  ]

  const pricingPlans: PricingPlan[] = [
    {
      title: "Gratis",
      price: "0 kr",
      period: "",
      buttonText: "Börja gratis",
      popular: false,
      features: [
        "3 videor per månad",
        "720p videokvalitet",
        "2 AI-presentatörer",
        "Grundläggande redigering",
        "Exportera till sociala medier",
      ],
    },
    {
      title: "Pro",
      price: "299 kr",
      period: "/månad",
      buttonText: "Välj Pro",
      popular: true,
      features: [
        "30 videor per månad",
        "1080p videokvalitet",
        "Alla AI-presentatörer",
        "Nedladdning av videor",
        "Prioriterad rendering",
      ],
    },
    {
      title: "Företag",
      price: "Kontakta oss",
      period: "",
      buttonText: "Kontakta oss",
      popular: false,
      features: [
        "Obegränsat antal videor",
        "4K videokvalitet",
        "Anpassade AI-presentatörer",
        "API-tillgång",
        "Dedikerad support",
      ],
    },
  ]

  const yearlyPricingPlans: PricingPlan[] = [
    {
      title: "Gratis",
      price: "0 kr",
      period: "",
      buttonText: "Börja gratis",
      popular: false,
      features: [
        "3 videor per månad",
        "720p videokvalitet",
        "2 AI-presentatörer",
        "Grundläggande redigering",
        "Exportera till sociala medier",
      ],
    },
    {
      title: "Pro",
      price: "2 868 kr",
      period: "/år",
      savings: "Spara 1 020 kr med årsbetalning",
      buttonText: "Välj Pro",
      popular: true,
      features: [
        "30 videor per månad",
        "1080p videokvalitet",
        "Alla AI-presentatörer",
        "Nedladdning av videor",
        "Prioriterad rendering",
      ],
    },
    {
      title: "Företag",
      price: "Kontakta oss",
      period: "",
      buttonText: "Kontakta oss",
      popular: false,
      features: [
        "Obegränsat antal videor",
        "4K videokvalitet",
        "Anpassade AI-presentatörer",
        "API-tillgång",
        "Dedikerad support",
      ],
    },
  ]

  const faqs = [
    {
      question: "Hur fungerar AI-videogeneratorn?",
      answer:
        "Vår AI-teknologi omvandlar ditt skrivna manus till naturligt tal och synkroniserar det med realistiska munrörelser på vår virtuella presentatör.",
    },
    {
      question: "Kan jag använda min egen logotyp?",
      answer: "Ja, Pro- och Företagsplaner tillåter anpassning med din egen logotyp och varumärkeselement i videorna.",
    },
    {
      question: "Hur lång tid tar det att skapa en video?",
      answer: "De flesta videor genereras inom 2-5 minuter beroende på längd och komplexitet i manuset.",
    },
    {
      question: "Äger jag rättigheterna till videorna?",
      answer: "Ja, du har full användningsrätt för alla videor du skapar på vår plattform för kommersiellt bruk.",
    },
  ]

  // Navbar scroll effect
  useEffect(() => {
    let lastScroll = 0

    const handleScroll = () => {
      const currentScroll = window.pageYOffset

      if (currentScroll <= 0) {
        setNavbarBackground("rgba(18, 18, 18, 0.95)")
        setNavbarTransform("translateY(0)")
        return
      }

      if (currentScroll > lastScroll) {
        // Scrolling down
        setNavbarTransform("translateY(-100%)")
      } else {
        // Scrolling up
        setNavbarTransform("translateY(0)")
        setNavbarBackground("rgba(18, 18, 18, 0.98)")
      }

      lastScroll = currentScroll
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Animation on scroll
  useEffect(() => {
    // Lägg till en liten fördröjning för att säkerställa att DOM är redo
    const timer = setTimeout(() => {
      document.querySelectorAll(".animate-fade-in").forEach((el, index) => {
        setTimeout(() => {
          el.classList.add("visible")
        }, index * 100)
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [activeTab])

  const handleGenerate = async () => {
    if (!script.trim()) {
      setError("Vänligen skriv in ett manus först")
      return
    }

    setError("")
    setLoading(true)
    setProgress(10)
    setGenerationStatus("Förbereder din video...")
    setVideoUrl("")

    try {
      // Simulera video-generering
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setProgress(50)
      setGenerationStatus("Genererar video...")
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setProgress(100)
      setGenerationStatus("Video klar!")
      setVideoUrl("/hero.mp4")
    } catch (error) {
      setError("Ett fel uppstod vid generering av videon. Försök igen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white font-['Outfit',sans-serif]">
      {/* Navigation */}
      <header
        className="fixed top-0 left-0 w-full z-50 border-b border-gray-800 backdrop-blur-md"
        style={{
          background: navbarBackground,
          transform: navbarTransform,
          transition: "all 0.3s ease",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <PostboxenLogo />
              </Link>
              <nav className="ml-10 hidden md:flex space-x-8">
                <button
                  onClick={() => setActiveTab("generator")}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${activeTab === "generator" ? "text-orange-500" : "text-gray-300 hover:text-white"}`}
                >
                  Generator
                </button>
                <button
                  onClick={() => setActiveTab("metod")}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${activeTab === "metod" ? "text-orange-500" : "text-gray-300 hover:text-white"}`}
                >
                  Vår Metod
                </button>
                <button
                  onClick={() => setActiveTab("tjänster")}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${activeTab === "tjänster" ? "text-orange-500" : "text-gray-300 hover:text-white"}`}
                >
                  Tjänster
                </button>
                <button
                  onClick={() => setActiveTab("ledarskap")}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${activeTab === "ledarskap" ? "text-orange-500" : "text-gray-300 hover:text-white"}`}
                >
                  Ledarskap
                </button>
                <button
                  onClick={() => setActiveTab("kontakt")}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${activeTab === "kontakt" ? "text-orange-500" : "text-gray-300 hover:text-white"}`}
                >
                  Kontakt
                </button>
              </nav>
            </div>
            <div className="md:hidden ml-auto">
              <Hamburger activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {activeTab === "generator" && (
          <>
            {/* Hero Section */}
            <section className="relative h-[80vh] flex items-center">
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-[#121212] opacity-80"></div>
                <div className="absolute inset-0 bg-[#121212] opacity-90"></div>
              </div>
              
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 font-['Rajdhani',sans-serif] bg-gradient-to-r from-orange-500 to-yellow-400 text-transparent bg-clip-text leading-tight">
                  Utveckla ditt ledarskap med ninja-precision
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
                  Precis som en ninja behärskar både styrka och smidighet, hjälper vi dig att utveckla ett
                  ledarskap som kombinerar tydlighet med anpassningsförmåga.
                </p>
                <Button className="bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 text-white px-12 py-6 rounded-full text-lg uppercase font-medium tracking-wide transform transition-transform hover:translate-y-[-2px] hover:shadow-lg">
                  Starta din resa
                </Button>
              </div>
            </section>

            {/* Video Generator Section */}
            <section className="py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Rajdhani',sans-serif] bg-gradient-to-r from-orange-500 to-yellow-400 text-transparent bg-clip-text">
                    Skapa din AI-videoannons
                  </h2>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    Skriv ditt manus, välj en presentatör och låt vår AI göra resten
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-10 bg-red-900/30 border-red-800 max-w-5xl mx-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                  <div className="space-y-8">
                    <div>
                      <label htmlFor="script" className="block text-sm font-medium mb-2">
                        Ditt manus
                      </label>
                      <Textarea
                        id="script"
                        placeholder="Skriv in ditt manus här... Beskriv vad du vill att din virtuella presentatör ska säga."
                        className="mb-4 bg-[#1a1a1a] text-white border-gray-700 focus:ring-orange-500 min-h-[200px]"
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="avatar-select" className="block text-sm font-medium mb-4">
                        Välj presentatör
                      </label>
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        {avatars.map((avatar) => (
                          <div
                            key={avatar.id}
                            className={`cursor-pointer rounded-lg p-3 text-center transition-all h-full flex flex-col items-center ${
                              selectedAvatar === avatar.id
                                ? "bg-gradient-to-r from-orange-500/20 to-yellow-400/20 border border-orange-500"
                                : "bg-[#1a1a1a] border border-gray-800 hover:bg-[#252525] hover:border-orange-500/50 hover:scale-105 transition-all duration-300"
                            }`}
                            onClick={() => setSelectedAvatar(avatar.id)}
                          >
                            <div className="w-full aspect-square mb-3">
                              <img
                                src={avatar.image || "/placeholder.svg"}
                                alt={avatar.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            </div>
                            <span className="text-sm">{avatar.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="voice-select" className="block text-sm font-medium mb-4">
                        Välj röst
                      </label>
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        {[
                          { id: "voice1", name: "Svenska (Kvinna)", flag: "🇸🇪" },
                          { id: "voice2", name: "Svenska (Man)", flag: "🇸🇪" },
                          { id: "voice3", name: "Engelska (Kvinna)", flag: "🇬🇧" },
                          { id: "voice4", name: "Engelska (Man)", flag: "🇬🇧" },
                        ].map((voice) => (
                          <div
                            key={voice.id}
                            className={`cursor-pointer rounded-lg p-3 text-center transition-all h-full flex flex-col items-center ${
                              selectedVoice === voice.id
                                ? "bg-gradient-to-r from-orange-500/20 to-yellow-400/20 border border-orange-500"
                                : "bg-[#1a1a1a] border border-gray-800 hover:bg-[#252525] hover:border-orange-500/50 hover:scale-105 transition-all duration-300"
                            }`}
                            onClick={() => setSelectedVoice(voice.id)}
                          >
                            <span className="text-2xl mb-2">{voice.flag}</span>
                            <span className="text-sm">{voice.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 text-white py-6 rounded-full uppercase font-medium tracking-wide transform transition-transform hover:translate-y-[-2px] hover:shadow-lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {generationStatus}
                        </>
                      ) : (
                        "Generera video"
                      )}
                    </Button>
                  </div>

                  <div className="space-y-8">
                    {loading && (
                      <div className="space-y-4">
                        <Progress value={progress} className="h-2" />
                        <p className="text-sm text-gray-400 text-center">{generationStatus}</p>
                      </div>
                    )}

                    {videoUrl && (
                      <div className="aspect-video bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-800">
                        <video controls className="w-full h-full">
                          <source src={videoUrl} type="video/mp4" />
                          Din webbläsare stödjer inte videouppspelning.
                        </video>
                      </div>
                    )}

                    {!loading && !videoUrl && (
                      <div className="aspect-video bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-800 flex items-center justify-center">
                        <div className="text-center p-8">
                          <Video className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400">
                            Din genererade video kommer att visas här
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "metod" && <MethodSection />}
        {activeTab === "tjänster" && <ServicesSection />}
        {activeTab === "ledarskap" && <LeadershipSection />}
        {activeTab === "kontakt" && <ContactSection />}
      </main>
    </div>
  )
} 