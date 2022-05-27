const path = require('path')
const { unZipAsync, zipAsync } = require('./zipHelper.js') 
const { diffDirAsync } = require('./bsAlgorithm.js')

async function testAsync(){
  const file = 'T0x16.zip'
  const dir = await unZipAsync(file)
  await diffDirAsync(dir)
  await zipAsync(dir, file)
}

testAsync()