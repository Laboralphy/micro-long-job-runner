function mixin (pClass, pMixin) {
    Object.assign(pClass.prototype, pMixin);
}

module.exports = mixin;
