/**
 * Created by pmeenaks on 7/28/2015.
 */

function Pivot(data) {

  if (data) {
    this.field = data.field;
    this.value = data.value;
    this.count = data.count;
    this.pivots = [];

    this.addPivot(this.pivots, data.pivot);
  }

}

Pivot.prototype.addPivot = function (pivots, data) {

  var pivotElement = data;

  if (pivotElement) {
    pivotElement.forEach(function (element, index, array) {

      var aPivot=  new Pivot(element);
      //aPivot.addPivot(aPivot.pivots, element.pivot)
      pivots.push(aPivot);
    });
  }

};
Pivot.prototype.toString = function pivotToString() {
  //return this.field;

  return 'Field->' + this.field + ', Count->' + this.count + ', Value ->' + this.value + ', Pivot->' + this.pivots + ', Pivot length -> ' + this.pivots.length;

}
function solrPivot(data) {

  this.data = data;
  this.facetFields = this.data.facet_counts["facet_fields"];
  this.fields = data.responseHeader.params["facet.field"];
  this.pivotKey = data.responseHeader.params["facet.pivot"];
  this.facetPivot = this.data.facet_counts["facet_pivot"][this.pivotKey];
  this.pivots = new Array();
  this.buildPivots(this.pivots);
}

solrPivot.prototype.buildPivots = function (pivotArray) {


  this.facetPivot.forEach(function (element, index, array) {
    var a = new Pivot(element);
    //console.log('Pivot added ' + a);
    pivotArray.push(a);
  });

}
solrPivot.prototype.toJSON = function () {

  return {
    'facetFields': this.facetFields,
    'pivots': this.pivots,
    'fields': this.fields

  }
}

solrPivot.prototype.display = function () {


  console.log(JSON.stringify(this));

};


module.exports = solrPivot;
