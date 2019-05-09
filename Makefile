ROOT=$(shell pwd)

test: test-integration

# test-unit:
# 	@echo "\nRunning unit tests..."
# 	@NODE_ENV=test CONFIG_FILE=${ROOT}/config/config.test.js mocha test/unit --recursive

test-integration:
	@echo "\nRunning integration tests..."
	@NODE_ENV=test CONFIG_FILE=${ROOT}/config/config.test.js mocha test/api/init
	@NODE_ENV=test PORT=3000 HOST=127.0.0.1 CONFIG_FILE=${ROOT}/config/config.test.js node bin/www &
	@NODE_ENV=test CONFIG_FILE=${ROOT}/config/config.test.js mocha \
	test/api/users test/api/auth test/api/account test/api/accessKeys test/api/apps test/api/index --recursive --timeout 15000

coverage:
	@echo "\n\nRunning coverage report..."
	rm -rf coverage
	# @NODE_ENV=test CONFIG_FILE=${ROOT}/config/config.test.js ./node_modules/istanbul/lib/cli.js cover --report lcovonly --dir coverage/core ./node_modules/.bin/_mocha \
	# 	test/unit -- -R spec --recursive --timeout 15000
	@NODE_ENV=test CONFIG_FILE=${ROOT}/config/config.test.js mocha test/api/init
	@NODE_ENV=test PORT=3000 HOST=127.0.0.1 CONFIG_FILE=${ROOT}/config/config.test.js node bin/www &
	@NODE_ENV=test CONFIG_FILE=${ROOT}/config/config.test.js ./node_modules/istanbul/lib/cli.js cover --report lcovonly --dir coverage/api ./node_modules/.bin/_mocha \
	test/api/users test/api/auth test/api/account test/api/accessKeys test/api/apps test/api/index -- -R spec --recursive --timeout 15000
	@NODE_ENV=test CONFIG_FILE=${ROOT}/config/config.test.js ./node_modules/istanbul/lib/cli.js report

.PHONY: coverage