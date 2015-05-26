var instep      = 1
var outstep     = instep + 1
var infile      = './bower-prep' + instep + '.json'
var outfile     = './bower-prep' + (instep+1) + '.json'
var fsurlSync   = require('fsurl').sync
var packages    = require(infile)
var fs          = require('fs')

var outpack = {}
var count = 10

for (var i in packages) {
	var pack = packages[i]
	var url = pack.url + '/master/bower.json'
	var bpack
	console.log('- >', i, '-', url)
	try {
		bpack = fsurlSync(url)
	} catch(e) {
		bpack = null
	}
	if (bpack) {
		console.log(i, url)
		var version = bpack.version
		pack.versions = pack.versions || {}
		pack.versions[version] = {
			main: bpack.main, dependencies: bpack.dependencies
		}
		if (bpack.description) pack.description = bpack.description
		packages[i] = pack
		count--
		if (count < 0) {
			fs.writeFileSync(outfile, JSON.stringify(packages, null, 2), 'utf-8')
			process.exit(1)
		}
	}
}
