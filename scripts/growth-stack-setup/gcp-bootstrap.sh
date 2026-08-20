#!/usr/bin/env bash
# One-time GCP setup for the growth-stack-setup scripts: a project, the two
# APIs they call, and a service account + key. Fully scriptable via gcloud --
# nothing here needs the browser except the `gcloud auth login` at the top,
# which only Google's login page itself can satisfy (no API bypass for
# authenticating a brand-new human identity).
#
# Run this yourself, authenticated as admin.siamrooftech@gmail.com -- do not
# run it under an existing gcloud session for a different account.
#
# Usage:
#   PROJECT_ID=siamrooftech-growth ./scripts/growth-stack-setup/gcp-bootstrap.sh

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-siamrooftech-growth}"
ACCOUNT="${ACCOUNT:-admin.siamrooftech@gmail.com}"
SA_NAME="${SA_NAME:-growth-stack-setup}"
KEY_FILE="${KEY_FILE:-$HOME/.config/siamrooftech/growth-stack-setup-key.json}"

echo "== 1/6 gcloud login (opens a browser; log in as ${ACCOUNT}) =="
gcloud auth login "${ACCOUNT}"
gcloud config set account "${ACCOUNT}"

echo "== 2/6 create project: ${PROJECT_ID} =="
if ! gcloud projects describe "${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud projects create "${PROJECT_ID}" --name="Siamrooftech Growth Stack"
else
  echo "  already exists, skipping"
fi
gcloud config set project "${PROJECT_ID}"

echo "== 3/6 link billing =="
echo "  GCP requires an active billing account to enable most APIs, even ones"
echo "  with a free tier. If this project has none yet, link one now:"
echo "    gcloud billing accounts list"
echo "    gcloud billing projects link ${PROJECT_ID} --billing-account=<ID>"
read -r -p "  Press enter once billing is linked (or already was)..." _

echo "== 4/6 enable APIs =="
gcloud services enable tagmanager.googleapis.com --project="${PROJECT_ID}"
gcloud services enable analyticsadmin.googleapis.com --project="${PROJECT_ID}"

echo "== 5/6 create service account: ${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com =="
if ! gcloud iam service-accounts describe "${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="Growth stack setup (GTM/GA4)" \
    --project="${PROJECT_ID}"
else
  echo "  already exists, skipping"
fi

echo "== 6/6 create key: ${KEY_FILE} =="
mkdir -p "$(dirname "${KEY_FILE}")"
if [ -f "${KEY_FILE}" ]; then
  echo "  ${KEY_FILE} already exists, not overwriting. Delete it first to regenerate."
else
  gcloud iam service-accounts keys create "${KEY_FILE}" \
    --iam-account="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
  chmod 600 "${KEY_FILE}"
fi

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

cat <<EOF

Done. GCP-side setup is complete.

Service account email (invite this into GTM and GA4 -- see README.md step 6):
  ${SA_EMAIL}

Export these before running the setup scripts:
  export GOOGLE_SERVICE_ACCOUNT_KEY_FILE=${KEY_FILE}
  export GTM_ACCOUNT_ID=<from tagmanager.google.com after creating your account+container>
  export GTM_CONTAINER_ID=<same place>
  export GA4_ACCOUNT_ID=<from analytics.google.com after creating your account>
EOF
