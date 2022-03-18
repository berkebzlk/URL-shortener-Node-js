const express = require('express')
const path = require('path')
const { default: mongoose } = require('mongoose')
const { nanoid } = require('nanoid')
const URL = require('./models/Url')
const helmet = require('helmet')
const yup = require('yup')
const rateLimit = require('express-rate-limit')
const slowDown = require('express-slow-down')
require('dotenv').config()

const app = express()

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connected'))
  .catch((err) => console.log(err))

app.use(express.static('./public'))
app.use(express.json())
app.use(helmet())
const notFoundPath = path.join(__dirname, 'public/404.html')

const schema = yup.object().shape({
  slug: yup
    .string()
    .trim()
    .matches(/^[\w\-]+$/i),
  urlLong: yup.string().trim().url().required(),
})

app.post(
  '/',
  // slowDown({
  //   windowMs: 30 * 1000,
  //   delayAfter: 1,
  //   delayMs: 500,
  // }),
  // rateLimit({
  //   windowMs: 30 * 1000,
  //   max: 1,
  // }),
  async (req, res, next) => {
    let { urlLong, slug } = req.body

    try {
      if (urlLong.includes('url-shortener-berkebzlk')) {
        throw new Error('You cant shorten my url!')
      }
      if (!slug) {
        slug = nanoid(5)
      }
      const isValid = await schema.isValid({
        slug,
        urlLong,
      })
      if (!isValid) {
        throw new Error('Please enter valid url')
      }
      slug.toLowerCase()
      const newURL = {
        urlLong,
        slug,
      }
      const existUrl = await URL.findOne({ slug })
      if (existUrl) {
        throw new Error(
          `${existUrl.slug} in use. Please try again with another slug`
        )
      }

      const createdURL = await URL.create(newURL)
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.json(createdURL)
    } catch (error) {
      next(error)
    }
  }
)

app.get('/:slug', async (req, res, next) => {
  const { slug } = req.params
  try {
    const url = await URL.findOne({ slug })
    if (url) {
      return res.redirect(url.urlLong)
    }
    return res.status(404).sendFile(notFoundPath)
  } catch (error) {
    return res.status(404).sendFile(notFoundPath)
  }
})

app.use((req, res, next) => {
  res.status(404).sendFile(notFoundPath)
})

app.use((error, req, res, next) => {
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? '🤡' : error.stack,
  })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`app is listening on ${port}`)
})
