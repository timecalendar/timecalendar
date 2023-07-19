import {
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material"
import { Box, Stack } from "@mui/system"
import adeImage from "modules/assistant/assets/images/select/ade.png"
import celcatImage from "modules/assistant/assets/images/select/celcat.png"
import hplanningImage from "modules/assistant/assets/images/select/hplanning.png"
import AssistantLayout from "modules/assistant/components/AssistantLayout"
import { AssistantContext } from "modules/assistant/contexts/AssistantContext"
import Image, { StaticImageData } from "next/image"
import { useRouter } from "next/router"
import { useContext } from "react"

interface AssistantCardProps {
  title: string
  name: string
  image?: StaticImageData
}

const AssistantCard = ({ title, name, image }: AssistantCardProps) => {
  const router = useRouter()
  return (
    <Card>
      <CardActionArea onClick={() => router.push(`/assistants/${name}`)}>
        <Box sx={{ display: "flex" }}>
          {image && (
            <CardMedia sx={{ width: "130px" }}>
              <Image src={image} alt="" />
            </CardMedia>
          )}
          <CardContent sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
          </CardContent>
        </Box>
      </CardActionArea>
    </Card>
  )
}

const SelectAssistant = () => {
  const { endAssistant } = useContext(AssistantContext)

  return (
    <AssistantLayout>
      <Stack spacing={2} my={2}>
        <Typography variant="h2" gutterBottom>
          Sélectionnez le logiciel d'emploi du temps de votre établissement
        </Typography>
        <Box>
          Pour importer votre emploi du temps, sélectionnez le logiciel de votre
          établissement.
        </Box>
        <Stack spacing={2}>
          <AssistantCard title="ADE" name="ade" image={adeImage} />
          <AssistantCard
            title="Hyperplanning"
            name="hplanning"
            image={hplanningImage}
          />
          <AssistantCard title="Celcat" name="celcat" image={celcatImage} />
          <AssistantCard title="Autre / Je ne sais pas" name="generic" />
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: "space-between" }}
        >
          <Button color="secondary">Retour</Button>
          <Button variant="outlined" onClick={() => endAssistant()}>
            Ajouter une URL ICal
          </Button>
        </Stack>
      </Stack>
    </AssistantLayout>
  )
}

export default SelectAssistant
