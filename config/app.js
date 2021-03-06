'use strict'

/**
 * Dependencies
 */

const express = require('express')
const path = require('path')
const ejs = require('ejs')
const fs = require('fs')
const os = require('os')
const formidable = require('formidable')
const child_process = require('child_process')

/**
 * Initialize app
 */

const app = express()

/**
 * Constants
 */

const port = 53011
const base = path.join(__dirname, '..')
const env = process.env.NODE_ENV || 'development'
const views = path.join(base, '/app/views')
const title = "Theme Builder"

/**
 * Locals
 */

app.locals.port = port
app.locals.base = base
app.locals.title = title
app.locals.views = views

/**
 * Settings
 */

app.set('env', env)
app.disable('x-powered-by')

/**
 * View engine
 */

app.engine('html.ejs', ejs.renderFile);
app.set('view engine', 'html.ejs')
app.set('views', views)

/**
 * Middleware
 */

app.use(require(base + '/lib/middleware/setup_instructions'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(require(base + '/lib/middleware/serve_favicon'))

/**
 * Static assets
 */

app.use('/assets', express.static(base + '/node_modules/jquery/dist'))
app.use('/assets', express.static(base + '/node_modules/popper.js/dist/umd'))
app.use('/assets', express.static(base + '/node_modules/font-awesome'))
app.use('/assets', express.static(base + '/tmp/bootstrap/dist'))

/**
 * Routes
 */

app.get("/", (req, res) => {
  let scss = fs.readFileSync(base + '/tmp/bootstrap/scss/_custom.scss', 'utf8')
  res.render("editor", { custom_scss: scss })
})
app.post("/update", (req, res, next) => {
  var form = new formidable.IncomingForm()
  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err)
    } else {
      let custom_scss = fields.style.toLowerCase()
      if (custom_scss.length == 0) {
        fs.writeFileSync(base + '/tmp/bootstrap/scss/_custom.scss', "// Drink the Sea" + os.EOL, 'utf8')
      } else {
        fs.writeFileSync(base + '/tmp/bootstrap/scss/_custom.scss', custom_scss + os.EOL, 'utf8')
      }
      child_process.exec('npm install', { cwd: base + '/tmp/bootstrap' }, (err, stdout, stderr) => {
        if (err) {
          next(err)
        } else {
          child_process.exec('npm run css-main', { cwd: base + '/tmp/bootstrap' }, (err, stdout, stderr) => {
            if (err) {
              next(err)
            } else {
              res.sendStatus(200)
            }
          })
        }
      })
    }
  })
})
app.get("/download", (req, res, next) => {
  let css_path = base + '/tmp/bootstrap/dist/css/bootstrap.min.css'
  res.download(css_path, 'bootstrap.min.css', (err) => {
    if (err) {
      next(err)
    } else {
      console.log('Sent:', 'bootstrap.min.css')
    }
  })
})

/**
 * Error handlers
 */

app.use(require(base + '/lib/middleware/page_not_found'))
app.use(require(base + '/lib/middleware/render_error'))


/**
 * Start server
 */

if (module === require.main) {
  app.listen(port, () => {
    console.log(`Running Express app on port ${port}`)
  })
}

/**
 * Export app
 */

module.exports = app
