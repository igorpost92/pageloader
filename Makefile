install:
	npm install

compile:
	npm run build -- --watch

publish: test lint;
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