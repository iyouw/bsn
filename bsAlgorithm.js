const bsdiff = require('bsdiff-node')
const path = require('path')
const fs = require('fs')
const fsPromise = fs.promises

async function traversalDirAsync(dirPath, filter, processFile){
  let res = []
  const files = await fsPromise.readdir(dirPath)
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const fileInfo = await fsPromise.stat(filePath)
    if(fileInfo.isFile() && filter(filePath)){
      res.push(processFile(filePath,fileInfo))
    } else if (fileInfo.isDirectory()){
      res = res.concat( await traversalDirAsync(filePath, filter, processFile))
    } else {
      continue
    }
  }
  return res
}

async function writePatchAsync(patches, patch_info, dirPath){
  const patchFile = path.join(dirPath, patch_info)
  await fsPromise.appendFile(patchFile, patches.join('|'))
}

async function findRootAsync(dirPath, baseFileName){
  if(fs.existsSync(path.join(dirPath, baseFileName))){
    return dirPath
  }
  const subFiles = await fsPromise.readFile(dirPath)
  for (const file of subFiles) {
    const filePath = path.join(dirPath, file)
    const info = await fsPromise.stat(filePath)
    if(info.isDirectory() && fs.existsSync(path.join(filePath, baseFileName))){
      return filePath
    }
  }
  throw new Error(`can not find baseFile: ${baseFileName}`)
}

async function diffDirAsync(dirPath, baseFileName="weex.js", filter = ".js", patchInfo="patch_info.txt"){
  const baseFile = path.join(dirPath,baseFileName)
  const rootPath = await findRootAsync(dirPath, baseFileName)
  const tasks = await traversalDirAsync(rootPath, file=> file.endsWith(filter) && (file != baseFile), file=> diffAsync(baseFile, file, rootPath))
  const pathes = await Promise.all(tasks)
  const patches =pathes.filter(x=>!!x)
  patches.unshift(baseFileName)
  await writePatchAsync(patches, patchInfo, rootPath)
}

async function diffAsync(oldFile,newFile,rootPath){
  let res = ''
  const dir = path.dirname(newFile)
  const name = path.basename(newFile,'.js')
  const patchFile = path.join(dir,`${name}_patch.js`)
  await bsdiff.diff(oldFile, newFile, patchFile)
  const newFileStat = await fsPromise.stat(newFile)
  const patchFileStat = await fsPromise.stat(patchFile)
  if(patchFileStat.size < newFileStat.size){
    await fsPromise.copyFile(patchFile, newFile)
    res = path.relative(rootPath, newFile)
  }
  await fsPromise.unlink(patchFile)
  return res
}


module.exports.diffAsync = diffAsync
module.exports.diffDirAsync = diffDirAsync