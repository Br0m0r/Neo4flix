.DEFAULT_GOAL := verify
.PHONY: verify test test-integration security dev-up dev-down seed-demo seed-audit seed-load

verify:
	pwsh -NoProfile -File scripts/verify.ps1

test:
	pwsh -NoProfile -File scripts/verify.ps1 -TestOnly

test-integration:
	pwsh -NoProfile -File scripts/verify.ps1 -Integration

security:
	pwsh -NoProfile -File scripts/security.ps1

dev-up:
	docker compose --env-file .env -f infra/compose.yml -f infra/compose.dev.yml up --build -d --wait --wait-timeout 600

dev-down:
	docker compose --env-file .env -f infra/compose.yml -f infra/compose.dev.yml down

seed-demo:
	pwsh -NoProfile -File scripts/seed.ps1 demo

seed-audit:
	pwsh -NoProfile -File scripts/seed.ps1 audit

seed-load:
	pwsh -NoProfile -File scripts/seed.ps1 load
