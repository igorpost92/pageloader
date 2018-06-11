install:
	npm install

compile:
	npm run compile

publish:
	npm publish

build:
	npm run build	

test:
	npm test

watch-test:
	npm test -- --watchAll

lint:
	npm run eslint .

start:
	npm run babel-node ./src/bin/pageloader.js