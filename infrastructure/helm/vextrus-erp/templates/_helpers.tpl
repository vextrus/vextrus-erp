{{/*
Expand the name of the chart.
*/}}
{{- define "vextrus-erp.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "vextrus-erp.fullname" -}}
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
{{- define "vextrus-erp.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "vextrus-erp.labels" -}}
helm.sh/chart: {{ include "vextrus-erp.chart" . }}
{{ include "vextrus-erp.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "vextrus-erp.selectorLabels" -}}
app.kubernetes.io/name: {{ include "vextrus-erp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "vextrus-erp.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "vextrus-erp.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create database URL from postgresql settings
*/}}
{{- define "vextrus-erp.databaseUrl" -}}
{{- if .Values.postgresql.enabled }}
postgresql://{{ .Values.postgresql.auth.username }}:{{ .Values.postgresql.auth.password }}@{{ .Release.Name }}-postgresql:5432/{{ .Values.postgresql.auth.database }}
{{- else }}
{{- .Values.externalDatabase.url }}
{{- end }}
{{- end }}

{{/*
Create Redis URL from redis settings
*/}}
{{- define "vextrus-erp.redisUrl" -}}
{{- if .Values.redis.enabled }}
redis://{{ if .Values.redis.auth.enabled }}:{{ .Values.redis.auth.password }}@{{ end }}{{ .Release.Name }}-redis-master:6379
{{- else }}
{{- .Values.externalRedis.url }}
{{- end }}
{{- end }}

{{/*
Create Kafka brokers string
*/}}
{{- define "vextrus-erp.kafkaBrokers" -}}
{{- if .Values.kafka.enabled }}
{{ .Release.Name }}-kafka:9092
{{- else }}
{{- .Values.externalKafka.brokers }}
{{- end }}
{{- end }}

{{/*
Create Temporal server address
*/}}
{{- define "vextrus-erp.temporalAddress" -}}
{{- if .Values.temporal.enabled }}
{{ .Release.Name }}-temporal:7233
{{- else }}
{{- .Values.externalTemporal.address }}
{{- end }}
{{- end }}