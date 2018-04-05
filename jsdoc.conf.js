// see http://usejsdoc.org/about-configuring-jsdoc.html

module.exports = {
  source: {
    include: [
      'src/Form.js',
      'src/Field.js',
      //'src/dodoc.js',
    ],
  },
  opts: {
    destination: './docs-html/',
    recurse: true,
    template: 'node_modules/docdash',
    tutorials: 'doc',
  },
  plugins: [
    'plugins/markdown',
    //'./node_modules/jsdoc-export-default-interop/dist/index',
  ],

  templates: {
    cleverLinks: false,
    //monospaceLinks: false,
  },
};
