var net = require('net'),
    fs = require ('fs'),
    expect = require('chai').expect,
    NsSocket = require('../lib/nssocket').NsSocket

var trollface = fs.readFileSync('test-mocha/fixtures/trollface.jpg')
var TCP_PORT = 5467

describe('nssocket/tcp/buffer', function () {
  before(function (done) {
    var self = this
    this.outbound = new NsSocket({
      type : 'tcp4',
      delimiter: '/'
    })
    this.server = net.createServer(function (inbound) {
      self.inbound = inbound
      done()
    })
    this.server.listen(TCP_PORT, function (stream) {
      self.outbound.connect(TCP_PORT)
    })
  })
  after(function () {
    this.server.close()
    this.outbound.end()
    this.inbound.end()
  })
  describe('#send()', function () {
    it('should correctly receive multi messages chunks / json', testMulti(5, { foo: 'bar' }))
    it('should correctly receive multi messages chunks / buffer', testMulti(5, Buffer('foo:bar')))
    it('should correctly receive multi messages chunks / large buffer', testMulti(5, trollface))
  })
})

function testMulti(n, data) {
  return function (done) {
    var self = this
    var message = self.outbound.createMessage('test::multi', data)
    var buffer = Buffer.concat(arrayOf(message, n), message.length * n)

    function onMessage(data) {
      n --
      expect(data).to.be.eql(data)
      if (!n) {
        self.outbound.undata('binary', onMessage)
        done()
      }
    }

    self.outbound.data('test::multi', onMessage)
    self.inbound.write(buffer)
  }
}

function arrayOf(what, howmany) {
  var arr = []
  for (var i = 0; i < howmany; i++) {
    arr.push(what)
  }
  return arr
}