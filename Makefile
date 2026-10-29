IMAGE ?= ghcr.io/screamxy/via
PLATFORMS ?= linux/amd64,linux/arm64
.PHONY: publish
# Production build and definition/keycode tests run inside the Docker build.
publish:
	@test -z "$$(git status --porcelain)" || { echo "Commit changes first so the image matches a revision."; exit 1; }
	docker buildx build --platform $(PLATFORMS) --push \
		--label org.opencontainers.image.revision=$$(git rev-parse HEAD) \
		-t $(IMAGE):latest -t $(IMAGE):$$(git rev-parse --short HEAD) .
