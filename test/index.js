var expect = require('chai').expect,
    bowr

describe('bowr', function() {
  it('should load', function(done) {
    bowr = require('..')
    done()
  })

  var expected = ["hello", "world"]
  var expectedString = JSON.stringify(expected)
  it('should eaual ' + expectedString, function(done) {
    var test = bowr(expected)
    var json = JSON.stringify(test)
    expect(json).to.equal(expectedString)
    done()
  })
})
