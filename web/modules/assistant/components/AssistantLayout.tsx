/** @jsxImportSource @emotion/react */
import { Container, Grid } from "@mui/material"
import { Box } from "@mui/system"
import Image, { StaticImageData } from "next/image"
import { ReactNode } from "react"

interface Props {
  children?: ReactNode
  image?: string | StaticImageData
  legend?: string | ReactNode
}

const AssistantLayout = ({ children, image, legend }: Props) => {
  return (
    <Grid container sx={{ height: "100%" }}>
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          boxShadow: "2px 0 2px rgb(0 0 0 / 2%)",
          height: "100%",
          backgroundColor: "white",
          overflow: "auto",
        }}
      >
        <Container maxWidth="sm">{children}</Container>
      </Grid>
      <Grid
        item
        xs={12}
        md={6}
        sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}
      >
        <Container maxWidth="sm">
          {image ? (
            <Box>
              <Image src={image} alt="Picture of the author" />
            </Box>
          ) : null}
          {legend ? (
            <Box mt={1} textAlign="center">
              {legend}
            </Box>
          ) : null}
        </Container>
      </Grid>
    </Grid>
  )
}

export default AssistantLayout
