import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import adeImage from "modules/assistant/assets/images/select/ade.png"
import celcatImage from "modules/assistant/assets/images/select/celcat.png"
import hplanningImage from "modules/assistant/assets/images/select/hplanning.png"
import AssistantLayout from "modules/assistant/components/AssistantLayout"
import { AssistantContext } from "modules/assistant/contexts/AssistantContext"
import Image, { StaticImageData } from "next/image"
import { useRouter } from "next/navigation"
import { useContext } from "react"

interface AssistantCardProps {
  title: string
  name: string
  image?: StaticImageData
}

const AssistantCard = ({ title, name, image }: AssistantCardProps) => {
  const router = useRouter()
  return (
    <Card
      className="cursor-pointer hover:bg-accent transition-colors"
      onClick={() => router.push(`/assistants/${name}`)}
    >
      <div className="flex">
        {image && (
          <div className="w-[130px] flex-shrink-0">
            <Image src={image} alt="" className="rounded-l-lg" />
          </div>
        )}
        <CardContent className="flex items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
        </CardContent>
      </div>
    </Card>
  )
}

const SelectAssistant = () => {
  const { endAssistant } = useContext(AssistantContext)

  return (
    <AssistantLayout>
      <div className="flex flex-col gap-4 my-4">
        <h1 className="text-3xl font-bold mb-2">
          Sélectionnez le logiciel d&apos;emploi du temps de votre établissement
        </h1>
        <p className="text-muted-foreground">
          Pour importer votre emploi du temps, sélectionnez le logiciel de votre
          établissement.
        </p>
        <div className="flex flex-col gap-4">
          <AssistantCard title="ADE" name="ade" image={adeImage} />
          <AssistantCard
            title="Hyperplanning"
            name="hplanning"
            image={hplanningImage}
          />
          <AssistantCard title="Celcat" name="celcat" image={celcatImage} />
          <AssistantCard title="Autre / Je ne sais pas" name="generic" />
        </div>
        <div className="flex flex-row gap-2 justify-between">
          <Button variant="secondary">Retour</Button>
          <Button variant="outline" onClick={() => endAssistant()}>
            Ajouter une URL ICal
          </Button>
        </div>
      </div>
    </AssistantLayout>
  )
}

export default SelectAssistant
