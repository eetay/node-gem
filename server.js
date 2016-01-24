var safeStringify = function(x) {
  return JSON.stringify(x)
}

var
  fs = require('fs'),
  pdf = require('html-pdf'),
//  http = require('http'),
  browserify = require('browserify'),
  literalify = require('literalify'),
  React = require('react'),
  ReactDOMServer = require('react-dom/server'),
  DOM = React.DOM, body = DOM.body, div = DOM.div, script = DOM.script,
  App = null // This is our React component, shared by server and browser thanks to browserify

var x=false;

var writeCallback = function(err, res) {
  console.log('writeCallback');
  if (err) return console.log(err);
  console.log(res); // { filename: '/app/businesscard.pdf' }
}

var formats = {
  'pdf': {
    'process': function(html, file) {
      console.log(html)
      pdf.create(html, { format: 'Letter' }).toFile(file, writeCallback)
    },
    'ext': '.pdf'
  },
  'html': {
    'process': function(html, file) {
      fs.writeFile(file, html, writeCallback)
    },
    'ext': '.html'
  }
}


process.argv.forEach(
  function (val, index, array) {
    if (index < 2) return;
    App = React.createFactory(require(val))

    // `props` represents the data to be passed in to the React component for
    // rendering - just as you would pass data, or expose variables in
    // templates such as Jade or Handlebars.  We just use some dummy data
    // here (with some potentially dangerous values for testing), but you could
    // imagine this would be objects typically fetched async from a DB,
    // filesystem or API, depending on the logged-in user, etc.
    var props = {
      items: [
        'Item 0',
        'Item 1',
        'Item </script>',
        'Item <!--inject!-->',
      ]
    }

    // Here we're using React to render the outer body, so we just use the
    // simpler renderToStaticMarkup function, but you could use any templating
    // language (or just a string) for the outer page template
    var html = ReactDOMServer.renderToStaticMarkup(body(null,

      // The actual server-side rendering of our component occurs here, and we
      // pass our data in as `props`. This div is the same one that the client
      // will "render" into on the browser from browser.js
      div({id: 'content', dangerouslySetInnerHTML: {__html:
        ReactDOMServer.renderToString(App(props))
      }}),

      // The props should match on the client and server, so we stringify them
      // on the page to be available for access by the code run in browser.js
      // You could use any var name here as long as it's unique
      script({dangerouslySetInnerHTML: {__html:
        'var APP_PROPS = ' + safeStringify(props) + ';'
      }}),

      // We'll load React from a CDN - you don't have to do this,
      // you can bundle it up or serve it locally if you like
      script({src: '//fb.me/react-0.14.6.min.js'}),
      script({src: '//fb.me/react-dom-0.14.6.min.js'}),

      // Then the browser will fetch and run the browserified bundle consisting
      // of browser.js and all its dependencies.
      // We serve this from the endpoint a few lines down.
      script({src: '/bundle.js'})
    ))

    var format = formats['pdf'];
    format.process(html, val + format.ext);
  }
) // forEach
