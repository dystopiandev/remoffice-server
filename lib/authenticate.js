const db = require('./db')

module.exports = function(email, password, callback) {
  return new Promise((resolve, reject) => {
    db.fetchUserByEmail(email)
      .then(function (user) {
        if (user.password === password) {
          resolve(user)
        } else {
          reject(new Error('Invalid credentials!'))
        }
      })
      .catch(function (err) {
        reject(new Error('No such user!'))
      })
  })
}