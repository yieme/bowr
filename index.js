/** Bower Package Server
 *
 *  @copyright  Copyright (C) 2015 by Yieme
 *  @module     bowr
 */
 (function() {
  'use strict';
  var BowrError = require('make-error')('BowrError')

  /** Bowr
   *  @class
   *  @param      {object} options - The options
   *  @return     {object}
   */
  function bowrClass(options) {
    /*jshint validthis: true */
    var self = this
    options = options || {}
    self.value = options
    return self
  }



  /** Bowr
   *  @constructor
   *  @param      {object} options - The options
   *  @return     {object}
   */
  function bowr(options) {
    return new bowrClass(options).value
  }


  module.exports = bowr
})();
