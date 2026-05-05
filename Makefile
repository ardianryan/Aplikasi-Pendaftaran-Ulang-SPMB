.PHONY: up down build logs setup

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

logs:
	docker-compose logs -f

setup:
	chmod +x docker-setup.sh
	./docker-setup.sh

release:
	chmod +x release.sh
	./release.sh
