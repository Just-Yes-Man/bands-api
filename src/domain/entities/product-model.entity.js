class ProductModel {
  constructor({ id = null, type, qrCode, expectedWeight, expectedColor, expectedHeight, active = true }) {
    if (!type || !qrCode) {
      throw new Error('type y qrCode son obligatorios');
    }

    if (Number(expectedWeight) < 0 || Number(expectedHeight) < 0) {
      throw new Error('expectedWeight y expectedHeight deben ser no negativos');
    }

    this.id = id;
    this.type = type;
    this.qrCode = qrCode;
    this.expectedWeight = Number(expectedWeight);
    this.expectedColor = expectedColor;
    this.expectedHeight = Number(expectedHeight);
    this.active = active;
  }
}

module.exports = {
  ProductModel
};
