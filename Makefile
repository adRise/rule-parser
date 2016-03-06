JISON=./node_modules/.bin/JISON

gen:
	@$(JISON) -o index.js rule.jison
