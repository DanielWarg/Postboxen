import Link from "next/link"
import { Linkedin, Instagram, Facebook } from "lucide-react"
import PostboxenLogo from "./postboxen-logo"

export default function Footer() {
  return (
    <footer className="bg-[#151515] border-t border-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center mb-8">
          <PostboxenLogo />
        </div>

        <div className="text-center text-gray-400 text-sm">
          <p>© 2023 Postboxen. Alla rättigheter förbehållna.</p>
          <div className="flex justify-center space-x-6 mt-4">
            <Link href="#" className="text-gray-400 hover:text-white text-sm">
              Integritetspolicy
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white text-sm">
              Användarvillkor
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white text-sm">
              Cookies
            </Link>
          </div>
          <div className="mt-6 flex justify-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-125">
              <Linkedin className="h-6 w-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-125">
              <Instagram className="h-6 w-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-125">
              <Facebook className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
