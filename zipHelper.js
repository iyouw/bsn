const os = require('os')
const path = require('path')
const fs = require('fs')
const unzip = require('unzipper')
const archiver = require('archiver')
const { v4 : uuid } = require('uuid')

const tmpDir = os.tmpdir()
const BS_CLOUD_DIR = path.join(tmpDir,'BSCLOUD')

function ensureDirExist(){
  if(!fs.existsSync(BS_CLOUD_DIR)){
    fs.mkdirSync(BS_CLOUD_DIR)
  }
}

ensureDirExist()

function zipAsync(dirPath, zipFileName){
  return new Promise((resolve,reject)=>{
    const zipFile = path.join(BS_CLOUD_DIR, zipFileName)
    const output = fs.createWriteStream(zipFile)
    const archive = new archiver('zip',{
      zlib:{
        level:9
      }
    })
    output.on('error',err=>reject(err))
    output.on('close', res=>{
      fs.rmdirSync(dirPath,{recursive:true})
      resolve(res)
    })
    archive.pipe(output)
    archive.directory(dirPath, false)
    archive.finalize()
  })
  
}

function unZipAsync(filePath){
  return new Promise((resolve,reject)=>{
    const dirPath = path.join(BS_CLOUD_DIR, uuid())
    const unZipStream = unzip.Extract({path:dirPath})
      .on('error', err=>reject(err))
      .on('close',  ()=>resolve(dirPath))
    fs.createReadStream(filePath).pipe(unZipStream)
  })
}

module.exports.unZipAsync =unZipAsync
module.exports.zipAsync = zipAsync