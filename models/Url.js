const mongoose = require('mongoose')

const urlSchema = new mongoose.Schema({
  urlLong: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
})

module.exports = mongoose.model('url', urlSchema)
