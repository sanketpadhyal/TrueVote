function Lenis() {
  this.raf = jest.fn();
  this.destroy = jest.fn();
  this.scrollTo = jest.fn();
}
Lenis.prototype.raf = jest.fn();
Lenis.prototype.destroy = jest.fn();
Lenis.prototype.scrollTo = jest.fn();

module.exports = Lenis;
module.exports.default = Lenis;
