import GroupAssistant from "modules/assistant/components/groups/GroupAssistant"
import SelectAssistant from "modules/assistant/components/groups/SelectAssistant"
import adeAssistant from "modules/assistant/data/assistants/ade"
import celcatAssistant from "modules/assistant/data/assistants/celcat"
import genericAssistant from "modules/assistant/data/assistants/generic"
import hplanningAssistant from "modules/assistant/data/assistants/hplanning"
import { AssistantStepContent } from "modules/assistant/types/StepContent"

export const assistants: AssistantStepContent[] = [
  {
    name: "groups",
    render: () => <GroupAssistant />,
  },
  {
    name: "select",
    render: () => <SelectAssistant />,
  },
  adeAssistant,
  celcatAssistant,
  genericAssistant,
  hplanningAssistant,
]

export const findAssistant = (asisstantName: string) =>
  assistants.find((assistant) => assistant.name === asisstantName)
