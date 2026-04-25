#!/usr/bin/env bash
# career-ops — Redeploy Cloud Run after code changes
#
# Usage:
#   bash deploy.sh              # rebuild image + update Cloud Run
#   bash deploy.sh --skip-build # update Cloud Run only (reuse current image)

set -euo pipefail

GREEN='\033[0;32m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC}  $*"; }
step() { echo -e "\n${BOLD}▶  $*${NC}"; }
err()  { echo -e "\033[0;31m✗\033[0m  $*"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

# Load .env if present; otherwise fall back to gcloud defaults
if [[ -f "$ENV_FILE" ]]; then
  while IFS= read -r line; do
    [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
    export "$line" 2>/dev/null || true
  done < "$ENV_FILE"
  ok "Loaded .env"
fi

# Fill in any missing values from gcloud config
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-career-ops-job-board}"
REPO_NAME="${REPO_NAME:-career-ops}"

[[ -z "$PROJECT_ID" ]] && err "Could not detect GCP project. Run: gcloud config set project YOUR_PROJECT_ID"

ok "Project: $PROJECT_ID | Region: $REGION | Service: $SERVICE_NAME"

SKIP_BUILD=false
[[ "${1:-}" == "--skip-build" ]] && SKIP_BUILD=true

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}"

if [[ "$SKIP_BUILD" == "false" ]]; then
  step "Building new image via Cloud Build"
  cd "$SCRIPT_DIR"
  gcloud builds submit \
    --region="$REGION" \
    --tag="$IMAGE:latest" \
    --project="$PROJECT_ID" \
    --quiet .
  ok "Image pushed: $IMAGE:latest"
fi

step "Updating Cloud Run service"
gcloud run services update "$SERVICE_NAME" \
  --image="$IMAGE:latest" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --quiet

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')

ok "Deployed: $SERVICE_URL"
echo ""
echo "  Trigger a run now:"
printf "  %s\n" "gcloud scheduler jobs run career-ops-scan --location=$REGION --project=$PROJECT_ID"
echo ""
