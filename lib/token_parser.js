'use strict';

/**
 * A simple token parser, which treat spaces as token separator.
 * @param {string} stream - stream to be parsed.
 * @constructor
 */
class TokenParser {
  constructor(stream){
    this._remained = stream.trimLeft();
    this._current = null;
  }

  get remained(){
    return this._remained;
  }

  get current(){
    return this._current;
  }

  /**
   * Move to next token in the stream.
   * @returns {string|null}
   */
  next() {
    if (!this.remained) {
      this._current = null;
      return null;
    }

    let p = this.remained.indexOf(' ');
    if (p < 0) {
      this._current = this.remained;
      this._remained = null;
    }
    else {
      this._current = this.remained.substr(0, p);
      this._remained = this.remained.substr(p + 1).trimLeft();
    }
    return this.current;
  }

  done(){
    this._current = null;
    this._remained = null;
  }
}

TokenParser.first = function (stream){
  stream = stream.trimLeft();
  let p = stream.indexOf(' ');
  return p > 0 ? stream.substr(0, p) : stream;
};

module.exports = TokenParser;
