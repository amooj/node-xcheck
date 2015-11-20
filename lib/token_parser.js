'use strict';

/**
 * A simple token parser, which treat spaces as token separator.
 * @param {string} stream - stream to be parsed.
 * @constructor
 */
function TokenParser(stream){
  this.remained = stream.trimLeft();
  this.current = null;
}

TokenParser.prototype = {
  constructor: TokenParser,

  /**
   * Move to next token in the stream.
   * @returns {string|undefined}
   */
  next: function () {
    if (!this.remained) {
      return undefined;
    }

    let p = this.remained.indexOf(' ');
    if (p < 0) {
      this.current = this.remained;
      this.remained = null;
    }
    else {
      this.current = this.remained.substr(0, p);
      this.remained = this.remained.substr(p + 1).trimLeft();
    }
    return this.current;
  }
};

module.exports = TokenParser;
