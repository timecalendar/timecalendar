import {
  useSchoolControllerFindSchools,
  useSchoolGroupControllerFindSchoolGroups,
} from "@/api/generated/schools/schools"
import type {
  SchoolForList,
  SchoolGroupItem,
} from "@/api/generated/timeCalendar.schemas"

import type { SchoolGroupNode, SchoolListItem } from "./types"

// The feature query layer — the ONLY place the generated Orval hooks are
// imported (screens consume @/features/school-selection). It wraps the generated
// TanStack Query hooks over the single customFetch mutator, maps the rep DTOs to
// the small domain shapes the screens render, and passes through TanStack's
// state flags. A future feature-boundary lint (TIM-135) formalizes "only data/
// touches generated hooks"; until then, review + this layout.

function toSchoolListItem(school: SchoolForList): SchoolListItem {
  return {
    id: school.id,
    name: school.name,
    code: school.code,
    imageUrl: school.imageUrl,
  }
}

function toSchoolGroupNode(group: SchoolGroupItem): SchoolGroupNode {
  return {
    text: group.text,
    value: group.value,
    children: group.children.map(toSchoolGroupNode),
  }
}

export interface SchoolsQuery {
  schools: SchoolListItem[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

export function useSchools(): SchoolsQuery {
  const { data, isLoading, isError, refetch } = useSchoolControllerFindSchools()
  return {
    schools: data?.schools.map(toSchoolListItem) ?? [],
    isLoading,
    isError,
    refetch: () => void refetch(),
  }
}

export interface SchoolGroupsQuery {
  groups: SchoolGroupNode[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

export function useSchoolGroups(schoolId: string): SchoolGroupsQuery {
  const { data, isLoading, isError, refetch } =
    useSchoolGroupControllerFindSchoolGroups(schoolId)
  return {
    groups: data?.groups.map(toSchoolGroupNode) ?? [],
    isLoading,
    isError,
    refetch: () => void refetch(),
  }
}
