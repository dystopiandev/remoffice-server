const bootSteps = 3
var bootProgress = 0

const bootStatus = function (progress = true) {
  if (progress) bootProgress++
  return '[' + bootProgress + '/' + bootSteps + ']'
}

module.exports = bootStatus