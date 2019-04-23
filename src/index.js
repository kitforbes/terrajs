const fs = require('fs');
const path = require('path');
const util = require('util');
const { exec } = require('child_process');
const debug = require('debug')('terrajs');
const merge = require('deepmerge');
const Handlebars = require('handlebars');

const { templatePath } = require('./constants');
const registerPartials = require('./registerPartials');
const registerHelpers = require('./registerHelpers');
const defaults = require('./defaults');

const execAsync = util.promisify(exec);

class Terrajs {
  constructor(options = {}) {
    this.command = options.command || 'terraform';
    this.execute = Object.prototype.hasOwnProperty.call(options, 'execute')
      ? options.execute
      : true;
    this.terraformDir = options.terraformDir || null;
    registerHelpers();
    registerPartials();
  }

  static getTemplate(action) {
    const source = fs.readFileSync(path.join(templatePath, `${action}.hbs`), 'utf-8');
    return Handlebars.compile(source);
  }

  buildCommand(action, args) {
    const context = merge(defaults[action], args);
    const template = Terrajs.getTemplate(action);
    const tfCmd = template({ ...context, command: this.command }).replace(/\n/g, ' ').trim();
    debug('command: %s', tfCmd);
    return tfCmd;
  }

  buildAndExec(action, args) {
    const cmd = this.buildCommand(action, args);
    const opts = this.terraformDir ? { cwd: this.terraformDir } : {};
    return execAsync(cmd, opts);
  }

  apply(args = {}) {
    return this.execute ? this.buildAndExec('apply', args) : this.buildCommand('apply', args);
  }

  init(args = {}) {
    return this.execute ? this.buildAndExec('init', args) : this.buildCommand('init', args);
  }

  output(args = {}) {
    return this.execute ? this.buildAndExec('output', args) : this.buildCommand('output', args);
  }

  plan(args = {}) {
    return this.execute ? this.buildAndExec('plan', args) : this.buildCommand('plan', args);
  }

  validate(args = {}) {
    return this.execute ? this.buildAndExec('validate', args) : this.buildCommand('validate', args);
  }
}

module.exports = Terrajs;
