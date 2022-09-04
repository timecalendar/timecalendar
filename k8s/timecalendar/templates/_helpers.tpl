{{/*
Expand the name of the chart.
*/}}
{{- define "timecalendar.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "timecalendar.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "timecalendar.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Server */}}
{{/*
Common labels
*/}}
{{- define "timecalendar.labels" -}}
helm.sh/chart: {{ include "timecalendar.chart" . }}
{{ include "timecalendar.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "timecalendar.selectorLabels" -}}
app.kubernetes.io/name: {{ include "timecalendar.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/* Web */}}
{{/*
Common labels
*/}}
{{- define "timecalendar.webLabels" -}}
helm.sh/chart: {{ include "timecalendar.chart" . }}
{{ include "timecalendar.webSelectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "timecalendar.webSelectorLabels" -}}
app.kubernetes.io/name: {{ include "timecalendar.name" . }}-web
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
