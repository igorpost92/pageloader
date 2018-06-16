install:
	npm install

compile:
	npm run build -- --watch

push: lint test;
	git push
	
publish: push;
	npm publish

build:
	npm run build	

test:
	npm test

debug:
	DEBUG="pageloader*" npm test

test-cover:
	npm test -- --coverage

watch-test:
	npm test -- --watchAll

lint:
	npm run eslint .

start:
	npm run babel-node ./src/bin/pageloader.js