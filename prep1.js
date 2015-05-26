var instep      = 0
var outfile     = './bower-prep' + (instep+1) + '.json'
var packages    = require('./bower.herokuapp.com~packages.json')
var fs          = require('fs')

var outpack = {}

for (var i=0; i < packages.length; i++) {
	var pack = packages[i]
	var url = pack.url
		.replace('git://', 'https://')
		.replace('.git', '')
		.replace('//github.com', '//raw.githubusercontent.com')
	;
	outpack[pack.name] = { url: url, hits: pack.hits }
}

fs.writeFileSync(outfile, JSON.stringify(outpack, null, 2), 'utf-8')
