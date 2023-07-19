import { Box, Button, Stack } from "@mui/material"
import { grey } from "@mui/material/colors"
import { Container } from "@mui/system"
import AssistantLayout from "modules/assistant/components/AssistantLayout"
import { StepContent } from "modules/assistant/types/StepContent"
import Image from "next/image"

interface Props {
  steps: StepContent[]
  stepIndex: number
  onNext: () => void
  onPrevious: () => void
}

const AssistantStep = ({ steps, stepIndex, onNext, onPrevious }: Props) => {
  const { image, legend, title, description } = steps[stepIndex]

  return (
    <AssistantLayout image={image} legend={legend}>
      <Box height="100vh" sx={{ display: "flex", alignItems: "center" }}>
        <Container maxWidth="sm">
          <h2>{title}</h2>
          <Box mb={3}>{description}</Box>
          <Box mb={3} sx={{ display: { md: "none" } }}>
            {image ? (
              <Box>
                <Image src={image} alt="" />
              </Box>
            ) : null}
            {legend ? (
              <Box mt={1} textAlign="center" color={grey[800]}>
                {legend}
              </Box>
            ) : null}
          </Box>
          <Stack
            direction="row"
            spacing={1}
            mb={2}
            sx={{ justifyContent: "flex-end" }}
          >
            <Button onClick={onPrevious}>Retour</Button>
            <Button variant="contained" onClick={onNext}>
              Suivant
            </Button>
          </Stack>
        </Container>
      </Box>
    </AssistantLayout>
  )
}

export default AssistantStep
