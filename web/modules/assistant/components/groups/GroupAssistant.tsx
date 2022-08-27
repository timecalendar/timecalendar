import { AssistantContext } from "modules/assistant/contexts/AssistantContext"
import React, { FC, useContext, useMemo, useState } from "react"
import CheckboxTree, { Node } from "react-checkbox-tree"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faCheckSquare,
  faMinusSquare,
  faPlusSquare,
  faSquare,
} from "@fortawesome/free-regular-svg-icons"
import {
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons"
import { useMutation, useQuery } from "react-query"
import { createApiInstance } from "modules/shared/utils/create-api-instance"
import { SchoolGroupItem, SchoolsApi } from "@timecalendar/api-client"
import PageCircularProgress from "modules/shared/components/PageCircularProgress"
import { Box, Button } from "@mui/material"
import { LoadingButton } from "@mui/lab"
import useLoading from "modules/shared/hooks/useLoading"
import { toast } from "react-toastify"
import AssistantLayout from "modules/assistant/components/AssistantLayout"
import { Stack } from "@mui/system"
import { postNativeMessage } from "modules/shared/helpers/post-native-message"

const serverToReactTree = (groups: SchoolGroupItem[]): Node[] =>
  groups.map((group) => ({
    value: group.value,
    label: group.text,
    children:
      group.children.length > 0 ? serverToReactTree(group.children) : undefined,
  }))

const GroupAssistant: FC = () => {
  const { school, createCalendar } = useContext(AssistantContext)

  const { data, isLoading } = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    `/schools/${school!.id}/school-group`,
    () =>
      createApiInstance(SchoolsApi)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .findSchoolGroups(school!.id)
        .then(({ data }) => data),
  )

  const { mutateAsync: getIcalUrl } = useMutation((groups: string[]) =>
    createApiInstance(SchoolsApi)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .getSchoolGroupsIcalUrl(school!.id, {
        groups,
      })
      .then(({ data }) => data),
  )

  const nodes = useMemo(
    () => (data ? serverToReactTree(data.groups) : undefined),
    [data],
  )

  const [, setClicked] = useState<Node>()
  const [checked, setChecked] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string[]>([])

  const [loading, submit] = useLoading(async () => {
    if (checked.length === 0)
      return toast.error("Vous devez sélectionner au moins un groupe.")
    if (checked.length > 100)
      return toast.error("Vous avez sélectionné trop de groupes.")

    const { url } = await getIcalUrl(checked)
    await createCalendar(url)

    console.log(url)
  })

  if (isLoading || !nodes) return <PageCircularProgress />

  return (
    <AssistantLayout>
      <Stack
        sx={{ display: "flex", flexDirection: "column", height: "100vh" }}
        spacing={2}
      >
        <Box>
          <h2>Sélectionnez vos groupes</h2>
          <Box>
            Sélectionnez vos groupes dans la liste pour importer votre emploi du
            temps.
          </Box>
        </Box>
        <Box sx={{ flexShrink: 1, overflow: "auto" }}>
          <CheckboxTree
            checked={checked}
            expanded={expanded}
            icons={{
              check: (
                <FontAwesomeIcon
                  className="rct-icon rct-icon-check"
                  icon={faCheckSquare}
                />
              ),
              uncheck: (
                <FontAwesomeIcon
                  className="rct-icon rct-icon-uncheck"
                  icon={faSquare}
                />
              ),
              halfCheck: (
                <FontAwesomeIcon
                  className="rct-icon rct-icon-half-check"
                  icon={faCheckSquare}
                />
              ),
              expandClose: (
                <FontAwesomeIcon
                  className="rct-icon rct-icon-expand-close"
                  icon={faChevronRight}
                />
              ),
              expandOpen: (
                <FontAwesomeIcon
                  className="rct-icon rct-icon-expand-open"
                  icon={faChevronDown}
                />
              ),
              expandAll: (
                <FontAwesomeIcon
                  className="rct-icon rct-icon-expand-all"
                  icon={faPlusSquare}
                />
              ),
              collapseAll: (
                <FontAwesomeIcon
                  className="rct-icon rct-icon-collapse-all"
                  icon={faMinusSquare}
                />
              ),
              parentClose: null,
              parentOpen: null,
              leaf: null,
            }}
            showNodeIcon={false}
            nodes={nodes}
            expandOnClick
            onClick={setClicked}
            onCheck={setChecked}
            onExpand={setExpanded}
          />
        </Box>
        <Box>
          <Stack
            direction="row"
            spacing={1}
            mb={4}
            sx={{ justifyContent: "flex-end" }}
          >
            <Button
              onClick={() =>
                postNativeMessage({
                  name: "calendarCreated",
                  payload: { token: "B4WZQHoJk31Yir6Mvu91P" },
                })
              }
            >
              Debug
            </Button>
            <Button>Retour</Button>
            <LoadingButton
              variant="contained"
              loading={loading}
              onClick={submit}
            >
              Valider
            </LoadingButton>
          </Stack>
        </Box>
      </Stack>
    </AssistantLayout>
  )
}

export default GroupAssistant
