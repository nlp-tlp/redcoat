// This script was not built by the UWA-NLP Team. It was made by tanbt on GitHub:
// https://github.com/tanbt/krippendorff-alpha
// We (the Redcoat Team) have made two minor modifications not including this comment: the class definition line (line 18) has been changed to 'class Krippendorff', and we added 'module.exports = Krippendorff' to the end of this file. line 6 has also changed to require math js


var math = require('mathjs');

const DATATYPE = {
  categorical: 1,
  ordinal: 2,
  interval: 3,
  ratio: 4,
};
Object.freeze(DATATYPE);

/**
 * Calculate Krippendorff's Alpha of a matrix of rating table
 */
class Krippendorff {

  /**
   * Init data for the calculator
   *
   * @param array data An javascript 2D array showing all ratings
   * @param string dataType The data type of rating
   */
  setArrayData(data, dataType) {
    this._data = data;
    this._dataType = DATATYPE[dataType];
    if (!dataType) {
      this._dataType = DATATYPE['categorical'];
    }
  }

  /**
   * Init data for the calculator
   *
   * @param json data json string showing all ratings
   * @param string dataType The data type of rating
   */
  setJsonData(data, dataType) {
    const jsonObj = JSON.parse(data);
    this._data = Object.keys(jsonObj).map(function(_) { return jsonObj[_]; });

    this._dataType = DATATYPE[dataType];
    if (!dataType) {
      this._dataType = DATATYPE['categorical'];
    }
  }

  calculate() {
    let filteredData = this._removeEmptyItem(this._data);
    this._ratingValues = this._getUniqueRatingValues(filteredData);
    this._agreementTable = this._getAgreementTable(filteredData, this._ratingValues);
    this._n = this._agreementTable.length;
    this._q = this._agreementTable[0].length;
    this._weightMatrix = this._getWeightMatrix(this._ratingValues, this._dataType);
    this._weightAgreementMatrix = this._getWeightedAgreementMatrix(this._agreementTable, this._weightMatrix);
    this._rArray = this._getArrayOfR(this._agreementTable);
    this._rMean = this._arraySum(this._rArray) / this._n;
    this._pArray = this._getArrayOfP(this._agreementTable, this._weightAgreementMatrix);
    this._epsilon = 1 / (this._n * this._rMean);
    this._piArray = this._getArrayOfPi(this._agreementTable, this._epsilon);
    this._pa = this._getPa(this._pArray, this._epsilon);
    this._pe = this._getPe(this._piArray, this._weightMatrix);
    this._KrAlpha = (this._pa - this._pe) / (1 - this._pe);
  }

  _getPe(piArray, weightMatrix) {
    const piMatrix = math.matrix([piArray]);
    let AAT = math.multiply(math.transpose(piMatrix), piMatrix);
    return math.sum(math.dotMultiply(AAT, weightMatrix));
  }

  _getPa(pArray, epsilon) {
    return this._arrayAverage(pArray) * (1 - epsilon) + epsilon;
  }

  _getArrayOfPi(agreementTable, epsilon) {
    const agreementMatrix = math.matrix(agreementTable);
    const transposedArray = math.transpose(agreementMatrix)._data;
    let result = [];
    transposedArray.forEach(arr => {
      result.push(this._arraySum(arr) * epsilon);
    });
    return result;
  }

  /**
   * Make sure this function is called after this._n and this._rMean are calculated.
   */
  _getArrayOfP(agreementTable, weightAgreementMatrix) {
    let result = [];
    let i;
    for (i = 0; i < this._n; i++) {
      const agree = agreementTable[i];
      const decresedWeightAgree = weightAgreementMatrix._data[i].map(x => x - 1);
      const sumProduct = math.sum(math.dotMultiply(agree, decresedWeightAgree));
      const divide = this._rMean * (this._rArray[i] - 1);
      result.push(sumProduct / divide);
    }
    return result;
  }

  _getArrayOfR(agreementTable) {
    let result = [];
    agreementTable.forEach(sub => {
      result.push(this._arraySum(sub));
    });
    return result;
  }

  _getWeightedAgreementMatrix(agreementTable, weightMatrix) {
    return math.multiply(agreementTable, weightMatrix);
  }

  _getAgreementTable(array2D, ratingValues) {
    let result = [];
    array2D.forEach(row => {
      let subject = [];
      ratingValues.forEach(val => {
        let count = row.filter(v => v === val).length;
        subject.push(count);
      });
      result.push(subject);
    });
    return result;
  }

  /**
   * Calculate weight matrix based on data type
   *
   * @param {*} ratingValues unique values of ratings
   * @param Integer dataType Data type from DATATYPE
   */
  _getWeightMatrix(ratingValues, dataType) {
    let result = [];
    let q = ratingValues.length;
    let h, k;
    for (h = 0; h < q; h++) {
      let row = [];
      for (k = 0; k < q; k++) {
        row.push(this._calculateWeight(ratingValues, h, k, dataType));
      }
      result.push(row);
    }
    return math.matrix(result);
  }

  _calculateWeight(ratingValues, h, k, dataType) {
    switch (dataType) {
      case DATATYPE['ordinal']:
      {
        if (k === h) {
          return 1;
        }
        const det = math.combinations(math.abs(ratingValues[k] - ratingValues[h]) + 1, 2);
        const fac = math.combinations(this._q, 2);
        return 1 - (det / fac);
      }
      case DATATYPE['interval']:
      {
        const min = Math.min(...ratingValues); // convert array to function params
        const max = Math.max(...ratingValues);
        return 1 - math.pow((ratingValues[k] - ratingValues[h]) / (max - min), 2);
      }
      case DATATYPE['ratio']:
        return 1 - math.pow((ratingValues[k] - ratingValues[h]) / (Number(ratingValues[k]) + Number(ratingValues[h])), 2);
      default:  // categorical
        return (ratingValues[h] === ratingValues[k]) ? 1 : 0;
    }
  }

  /**
   * Items (or Observers, which is arrays) less than 2 values are removed
   *
   * @param array array2D the 2D array
   */
  _removeEmptyItem(array2D) {
    return array2D.filter(arr => !this._isEmptyItem(arr));
  }

  _isEmptyItem(arr) {
    let result = arr.filter(val => !this._isEmptyItemValue(val));
    return result.length < 2;
  }

  _isEmptyItemValue(val) {
    return val === '' || val === '#';
  }

  _arraySum(arr) {
    return arr.reduce((a, b) => a + b, 0);
  }

  _arrayAverage(arr) {
    return this._arraySum(arr) / arr.length;
  }

  /**
   * Get unique rating values to be columns of Agreement Table
   *
   * @param array array2D the 2D array
   */
  _getUniqueRatingValues(array2D) {
    let mergedArray = [];
    array2D.forEach(arr => mergedArray = mergedArray.concat(arr));
    let result = [... new Set(mergedArray)];
    result = result.filter(val => !this._isEmptyItemValue(val));
    return result.sort();
  }
}

module.exports = Krippendorff;// This script was made by tanbt on GitHub: