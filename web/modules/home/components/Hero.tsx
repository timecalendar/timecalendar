import { AppCTAs } from "@/modules/home/components/AppCTAs"
import homeImg from "modules/home/assets/home.png"
import Image from "next/image"
import Link from "next/link"
import { Button } from "components/ui/button"
import { ChevronRight } from "lucide-react"

export function Hero() {
  return (
    <div className="relative overflow-hidden md:min-h-screen py-0 md:px-12 shadow-[0_5px_10px_rgba(0,0,0,0.03)] md:white">
      <span className="hidden md:block">
        <div className="absolute z-[-1] w-3/5 min-h-0 h-full bg-[#e66b8c] skew-x-[8deg] origin-top-left right-0 inset-y-0"></div>
      </span>
      <div className="md:min-h-screen flex flex-col md:flex-row items-center md:justify-between">
        <div
          className="w-full px-4 md:px-0 md:max-w-[40%] py-[100px] md:py-0"
          id="landing-container"
        >
          <div className="space-y-4">
            <div className="text-[42px] font-bold leading-[1.15em] mb-5">
              Consultez votre emploi du temps universitaire
            </div>
            <p>
              Consultez votre emploi du temps et recevez des notifications lors
              de modifications de cours grâce à votre nouvel assistant.
            </p>
            <div>
              <Button
                size="lg"
                className="uppercase bg-transparent"
                variant="outline"
                asChild
              >
                <Link href="/ecoles">
                  Démarrer
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="flex space-x-2">
              <AppCTAs />
            </div>
          </div>
        </div>
        <div
          className="w-full px-4 py-16 md:p-0 md:max-w-[40%] bg-[#e66b8c] md:bg-transparent"
          id="image-container"
        >
          <div className="max-w-[20rem] mx-auto md:max-w-none">
            <Image src={homeImg} alt="" />
          </div>
        </div>
      </div>
    </div>
  )
}
