.DEFAULT_GOAL := verify
.PHONY: verify test test-integration dev-up dev-down

verify:
	pwsh -NoProfile -File scripts/verify.ps1

test:
	pwsh -NoProfile -File scripts/verify.ps1 -TestOnly

test-integration:
	pwsh -NoProfile -File scripts/verify.ps1 -Integration

dev-up:
	docker compose --env-file .env -f infra/compose.yml -f infra/compose.dev.yml up --build -d --wait --wait-timeout 600

dev-down:
	docker compose --env-file .env -f infra/compose.yml -f infra/compose.dev.yml down
