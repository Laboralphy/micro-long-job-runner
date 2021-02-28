const PromFS = require('./index')
const util = require('util')
const path = require('path')

function dumpArray(a) {
  console.log(util.inspect(a, false, Infinity))
}

async function main() {
  const sBasePath = '../../services/couchbase/repositories'
  const t1 = await PromFS.tree(sBasePath)
  const t2 = t1.map(x => {
    const basename = path.basename(x, '.js')
    const filename = x
    const dir = path.dirname(x)
    const name = basename.split('-').slice(1).join('-')
    const method = basename.split('-').shift()
    const script = require(path.join(sBasePath, filename))
    const paramcount = script.length - 1
    const params = []
    for (let i = 0; i < paramcount; ++i) {
      params.push(':p' + i)
    }
    const id = '/' + path.join(dir, name)
    const route = id + (params.length > 0 ? '/' + params.join('/') : '')
    return {
      id,
      method,
      route,
      script
    }
  })
  dumpArray(t2)
}

function runRoute(sQuery) {
  // sQuery = '/toto/tutu/machin/10/20/30'

}

main()

